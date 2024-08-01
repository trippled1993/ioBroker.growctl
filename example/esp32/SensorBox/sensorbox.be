
import string
import json
import persist
import mqtt

var sensorbox = module('sensorbox')

# All tasmota calls are accessed via api class
class api
    static wd = tasmota.wd
    static settings = persist
    static WS2812 = gpio.pin(gpio.WS2812, 2)            #### ?????
    static def strftime(fmt, secs)
        return tasmota.strftime(fmt, secs)
    end
    static def strptime(time, fmt)
        return tasmota.strptime(time, fmt)
    end
    static def rtc()
        return tasmota.rtc()
    end
    static def time_dump(secs)
        return tasmota.time_dump(secs)
    end
    static def now()
        var l = tasmota.rtc()['local']
        var t = tasmota.time_dump(l)
        var sfm = t['hour']*3600+t['min']*60+t['sec']
        t.setitem('sfm', sfm)
        t.setitem('local', l)
        return t
    end
    static def tomorrow(day)
        var wd = day != nil ? day : api.now()['weekday']
        return wd < 6 ? wd+1 : 0
    end
    static def millis()
        return tasmota.millis()
    end
    static def cmd(text)
        return tasmota.cmd(text)
    end
    static def set_timer(millis, func, id)
        tasmota.set_timer(millis, func, id)
    end
    static def remove_timer(id)
        tasmota.remove_timer(id)
    end
    static def add_cron(cron, func, id)
        tasmota.add_cron(cron, func, id)
    end
    static def remove_cron(id)
        tasmota.remove_cron(id)
    end
    static def next_cron(id)
        return tasmota.next_cron(id)
    end
    static def get_power()
        return tasmota.get_power()
    end
    static def set_power(zone, power)
        if api.get_relay_count() > zone
            if tasmota.get_power()[zone] != power
                tasmota.set_power(zone, power)
            end
        end
    end
    static def add_rule(trigger, func)
        tasmota.add_rule(trigger, func)
    end
    static def add_driver(inst)
        tasmota.add_driver(inst)
    end
    static def remove_rule(trigger)
        tasmota.remove_rule(trigger)
    end
    static def add_cmd(cmd, func)
        tasmota.add_cmd(cmd, func)
    end
    static def resp_cmnd(payload)
        tasmota.resp_cmnd(payload)
    end
    static def web_send(msg)
        tasmota.web_send(msg)
    end
    static def response_append(msg)
        tasmota.response_append(msg)
    end

    static def mqtt_connected()
        return mqtt.connected()
    end
    # static def publish_result(payload, subtopic)
    #     var _subtopic = subtopic ? subtopic : "RESULT"
    #     tasmota.publish_result(payload, _subtopic)
    # end

    # Find a key in map, case insensitive
    # Returns key or nil if not found
    static def find_key_i(m, keyi)
        return tasmota.find_key_i(m, keyi)
    end
    static def get_relay_count()
        def pin(t, enum)
            while gpio.pin(enum, t) != -1 t+=1 end
            return t
        end
        return pin(0, gpio.REL1) + pin(0, gpio.REL1_INV)
    end
end



class util
  
    static driver = nil
    static iostatus = nil
  
    static def publish(topic, payload)
         var pld
         pld = str(payload)
        # if util.iostatus.mqttCache.contains(topic) && util.iostatus.mqttCache.item(topic) == pld return end
        # #print(topic, pld, type(pld)    )
        mqtt.publish("dp/B01-SEN/" + topic, pld)
        # util.iostatus.mqttCache.setitem(topic, pld)
    end
end


class iostatus
    var states
    var mqttCache
    var secCounter

    def init()
        self.states = {
            "POWER1": false,
            "POWER2": false,
            "POWER3": false,
        }

        self.mqttCache = {}
        for key: self.states.keys()
           self.mqttCache.insert(key, self.states[key])
        end
        self.secCounter = 0
    end

    def read()
        self.states["POWER1"] = tasmota.get_power(0)
        self.states["POWER2"] = tasmota.get_power(1)
        self.states["POWER3"] = tasmota.get_power(2)
     
    end

    def reset()
        tasmota.set_power(1,false)
        tasmota.set_power(2,false)
        tasmota.set_power(3,false)
    end

    def publishIO(all)
        self.read()
        for key: self.states.keys()
            var value 
            var currentTopic 
            value = self.states[key]
            if self.mqttCache[key] != value || all
                currentTopic = "iostatus/" + key
                print("Publish: " + currentTopic)
                util.publish(currentTopic, value)
                self.mqttCache[key] = value
            end
        end
    end

    def publishHeartbeat()
        util.publish("heartbeatFromClient", api.now()['local'])
    end

    def readSensor(force)
        try
            print("ReadSensor")
            var jstring = tasmota.read_sensors()
            var sensors=json.load(jstring)
            self.publishSensor(sensors, "sensor", force)
        except .. as e,m
            print(str(e)+":"+str(m))
        end
    end

    def readPWM(force)
        try
            var pwm = tasmota.cmd("PWM")
            self.publishSensor(pwm, "sensor", force)
        except .. as e,m
            print(str(e)+":"+str(m))
        end
    end    

    def publishSensor(data, topicPrefix, force)
        for key: data.keys()
            
            var value = data[key]
            var currentTopic = topicPrefix + "/" + key
            if type(value) == "map" ||type(value) == "instance"
                self.publishSensor(value, currentTopic)
            else
                if force || !self.mqttCache.contains(currentTopic) || self.mqttCache[currentTopic] != value
                    print("Publish: " + currentTopic)
                    util.publish(currentTopic, value)
                    self.mqttCache[currentTopic] = value
                end
            end
        end
    end
end

class driver
    var secCounter 
    def init()
        self.secCounter = 0
    end



    def every_100ms()
        if api.mqtt_connected() 
            util.iostatus.publishIO(false)
            util.iostatus.readPWM(false)
        end
    end

     def every_second()
        self.secCounter = self.secCounter + 1
        if self.secCounter % 5 == 0
            print("5 Seconds---")
            if api.mqtt_connected() 
                util.iostatus.publishHeartbeat()
            end
        end
        
        if self.secCounter % 10 == 0
            print("10 Seconds---")
            if api.mqtt_connected() 
                util.iostatus.readSensor(false)
            end
        end
        if self.secCounter % 60 == 0
            print("60 Seconds---")
            if api.mqtt_connected() 
                util.iostatus.readSensor(true)
                util.iostatus.publishIO(true)
                util.iostatus.readPWM(true)
            end
        end

     end
end


# The main class for setting up the heating controller
class SensorBox
    def init()
        self._start()
    end
    # Start the heating controller
    def _start()
        print("SensorBox, started")
        print("SensorBox, started2")
        print("SensorBox, started3")
        print("SensorBox, started4")
       

        util.iostatus = iostatus()

        # Create a tasmota driver
        util.driver = driver()
        util.driver.init()
        # Register the tasmota driver
        api.add_driver(util.driver)
       
    end
   
    
end






sensorbox.controller = SensorBox
return sensorbox

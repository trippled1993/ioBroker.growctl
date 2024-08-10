# Verfahrensbeschreibung zur Steuerung eines Gewächshauses

## 1\. Einleitung

Diese Verfahrensbeschreibung dokumentiert die Steuerung eines weitgehend luft- und lichtdichten Gewächshauses, betrieben durch einen Raspberry Pi. Die Steuerung umfasst die Temperaturregelung, Luftfeuchtigkeitskontrolle, Beleuchtung und Lüftung, unter Berücksichtigung der Abwärme durch Beleuchtung und Entfeuchter. Sensoren für Temperatur, Luftfeuchtigkeit und Bodenfeuchtigkeit liefern die notwendigen Daten zur optimalen Steuerung.

## 2\. Systemübersicht

### 2.1 Steuerkomponenten

1. **Heizung:** Reguliert die Temperatur im Gewächshaus (An/Aus).
2. **Lüfter:** Sorgt für Luftzirkulation und einen konstanten Unterdruck, um Gerüche aus dem Gewächshaus zu verhindern (0-100% steuerbar, abhängig von der Differenz zwischen Soll- und Ist-Werten).
3. **Entfeuchter:** Reduziert die Luftfeuchtigkeit und produziert gleichzeitig Abwärme (An/Aus).
4. **Licht:** Zeitgesteuerte Beleuchtung, die vorzugsweise nachts betrieben wird, um zusätzliche Erwärmung tagsüber zu vermeiden (An/Aus).

## 2.2 Sensoren

1. **Raumtemperatursensor:** Misst die Temperatur im Gewächshaus.
2. **Raumfeuchtesensor:** Misst die Luftfeuchtigkeit im Gewächshaus.
3. **Bodenfeuchtesensoren (6 Stück):** Messen die Bodenfeuchtigkeit der Pflanzen. Diese Werte werden gespeichert und zur Analyse verwendet.

## 3\. Parameterdefinition

### 3.1 Soll-Temperatur

1. **Beschreibung:** Die Zieltemperatur, die im Gewächshaus aufrechterhalten werden soll.
2. **Wertbereich:** Benutzerdefiniert (z. B. 20°C).

### 3.2 Soll-Feuchtigkeit

1. **Beschreibung:** Die Ziel-Luftfeuchtigkeit, die im Gewächshaus aufrechterhalten werden soll.
2. **Wertbereich:** Benutzerdefiniert (z. B. 60%).

### 3.3 Temperatur-Hysterese

1. **Beschreibung:** Der Bereich um die Soll-Temperatur, innerhalb dessen keine Heiz- oder Kühlmaßnahmen ergriffen werden.
2. **Wertbereich:** Benutzerdefiniert (z. B. ±2°C).

### 3.4 Feuchte-Hysterese

1. **Beschreibung:** Der Bereich um die Soll-Feuchtigkeit, innerhalb dessen keine Entfeuchtungsmaßnahmen ergriffen werden.
2. **Wertbereich:** Benutzerdefiniert (z. B. ±5%).

### 3.5 Temperatur Max

1. **Beschreibung:** Die maximale Temperatur, bei deren Überschreitung die Lampe und der Entfeuchter abgeschaltet und die Lüfter auf maximale Leistung gestellt werden. Um Flackern zu vermeiden, wird auch hier die Hysterese berücksichtigt.
2. **Wertbereich:** Benutzerdefiniert (z. B. 30°C)

### 3.6 Feuchtigkeit Max

1. **Beschreibung:** Die maximale Luftfeuchtigkeit, bei deren Überschreitung der Entfeuchter aktiviert wird und der Lüfter abgeschaltet wird, um nicht feuchtere Luft von außen anzusaugen. Um Flackern zu vermeiden, wird auch hier die Hysterese berücksichtigt.
2. **Wertbereich:** Benutzerdefiniert (z. B. 80%).

### 3.6 Mindestleistung Lüfter

1. **Beschreibung:** Die Mindestleistung des Lüfters, welche im Normalbetrieb dauerhaft eingestellt ist, um einen Unterdruck im Gewächshaus zu erzeugen.
2. **Wertbereich:** Benutzerdefiniert (z. B. 20%).

## 4\. Bodenfeuchtesensor-Kalibrierung

1. **Kalibrierung:** Jeder der sechs Bodenfeuchtesensoren muss vor dem Einsatz kalibriert werden.
2. **Trockenwert (0%):** Der Sensor wird getrocknet und an die Luft gehalten.
3. **Feuchtwert (100%):** Der Sensor wird in Wasser getaucht.
4. **Speicherung:** Diese Werte werden gespeichert und nachfolgende Messungen werden entsprechend skaliert.

## 6\. Aktor-Steuerung

### 6.1 Heizung

1. **Funktion:** Erhöht die Temperatur im Gewächshaus, wenn die gemessene Temperatur unter den definierten Sollwert fällt.
2. **Betrieb:** Ein/Aus gesteuert durch die gemessene Temperatur im Vergleich zur Soll-Temperatur mit Hysterese. Sicherheitsabschaltung bei Überschreitung der Max-Temperatur.

### 6.2 Lüfter

1. **Funktion:** Läuft kontinuierlich mit niedriger Drehzahl (z.B. 20% (Parameter „Mindestleistung Lüfter“), um einen Unterdruck im Gewächshaus aufrechtzuerhalten und Gerüche nach außen zu verhindern. Die Leistung wird linear abhängig von der Differenz zwischen Soll- und Ist-Temperatur gesteuert. Bei Max-Temperatur wird der Lüfter auf maximale Leistung gesetzt.
2. **Betrieb:** Dauerhaft mit niedriger Drehzahl aktiv. Leistung wird linear erhöht, wenn die Temperatur über dem Sollwert liegt. Max-Temperatur und Max-Feuchtigkeit werden überwacht, um die Leistung entsprechend anzupassen.

### 6.3 Entfeuchter

1. **Funktion:** Reduziert die Luftfeuchtigkeit im Gewächshaus, indem er Feuchtigkeit aus der Luft zieht und gleichzeitig Wärme produziert.
2. **Betrieb:** Ein/Aus gesteuert durch die gemessene Luftfeuchtigkeit im Vergleich zur Soll-Feuchtigkeit. Wird bei Überschreitung der Max-Temperatur abgeschaltet.

### 6.4 Licht

1. **Funktion:** Stellt die notwendige Beleuchtung für das Pflanzenwachstum bereit und produziert dabei Abwärme.
2. **Betrieb:** Zeitgesteuert, vorzugsweise nachts im Sommer, um zusätzliche Erwärmung tagsüber zu vermeiden. Im Winter kann das Licht nachts genutzt werden, um die kühle Außentemperatur durch die Abwärme auszugleichen. Wird bei Max-Temperatur abgeschaltet.

## 7\. Sicherheitsmechanismen

1. **Fehlererkennung:** Kontinuierliche Überwachung der Sensoren. Bei einem Ausfall wird ein Alarm ausgelöst und gegebenenfalls ein Sicherheitsmodus aktiviert.
2. **Notabschaltung:** Bei kritischen Abweichungen der Temperatur (Max) wird das System in einen sicheren Zustand versetzt (Heizung, Licht und Entfeuchter aus, Lüfter an bei MaxTemp, aus bei MaxFeuchte).

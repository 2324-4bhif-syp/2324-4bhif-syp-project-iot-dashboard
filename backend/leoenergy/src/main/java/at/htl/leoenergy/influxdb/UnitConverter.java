package at.htl.leoenergy.influxdb;

import at.htl.leoenergy.entity.SensorValue;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UnitConverter {
    public  void setTypeOfDevice(SensorValue sensorValue) {
        switch (sensorValue.getUnit()) {
            case "W", "Wh":
                if (sensorValue.getDeviceName().equals("PV-Energie"))
                    sensorValue.setRelation("production");
                else {
                    sensorValue.setRelation("consumption");
                }
                break;
        }
    }
}
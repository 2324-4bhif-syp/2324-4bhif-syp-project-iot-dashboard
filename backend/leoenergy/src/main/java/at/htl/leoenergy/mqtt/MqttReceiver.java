package at.htl.leoenergy.mqtt;

import at.htl.leoenergy.entity.SensorValue;
import at.htl.leoenergy.influxdb.InfluxDbRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;

@ApplicationScoped
public class MqttReceiver {
   @Inject
    InfluxDbRepository influxDbRepository;

   public void insertMeasurement(SensorValue sensorValue){
       influxDbRepository.insertMeasurementFromJSON(sensorValue);
   }
    @Incoming("leoenergy")
    public void receive(byte[] byteArray) {
        String msg = new String(byteArray);
        try {
            SensorValue sensorValue = SensorValue.fromJson(msg);
            insertMeasurement(sensorValue);
        }
        catch (NullPointerException e){
            e.printStackTrace();
        }

    }

}

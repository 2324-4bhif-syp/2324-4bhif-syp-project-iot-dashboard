import { Component, OnInit } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import weatherCodes from '../../assets/weather-codes.json';
import iconMapping from '../../assets/icon-mapping.json';
import {DatePipe, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import Chart from 'chart.js/auto';
import weatherGifs from '../../assets/weather-gifs.json';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgOptimizedImage,
    DatePipe,
  ],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit{
  weatherData: any;
  hourlyData: any[] = [];
  dailyData: any;
  latitude = 48.2797;  // Breitengrad von Leonding
  longitude = 14.2533; // Längengrad von Leonding
  errorMessage?: string;
  monthlyWeatherSummary: { sunny: number; cloudy: number; rainy: number } = { sunny: 0, cloudy: 0, rainy: 0 };
  weatherCodes: { [key: string]: string } = weatherCodes;
  weatherGifs: { [key: string]: string } = weatherGifs;
  iconMapping: { [key: string]: string } = iconMapping;
  currentMonth: string = '';
  currentWeatherCondition?: number;
  currentTemp?: number;
  currentConditionDescription?: string;
  currentWind?: number;
  currentHumidity?: number;


  constructor(private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.getWeather();
    this.getMonthlyWeather();
    this.setCurrentMonth();
  }

  getWeather(): void {
    this.weatherService.getWeatherForecast(this.latitude, this.longitude)
      .subscribe(
        data => {
          this.weatherData = data;
          console.log('Daten von der Wetter-API:', this.weatherData);
          this.processData();
        },
        error => {
          this.errorMessage = 'Fehler beim Abrufen der Wetterdaten';
          console.error(this.errorMessage, error);
        }
      );
  }

  processData(): void {
    const now = new Date();
    const currentHour = now.getHours();

    // Aktuelle Wetterdaten setzen
    if (this.weatherData.current_weather) {
      this.currentTemp = this.weatherData.current_weather.temperature;
      this.currentConditionDescription = this.getWeatherDescription(this.weatherData.current_weather.weathercode);
      this.currentWind = this.weatherData.current_weather.windspeed;

      this.currentWeatherCondition = this.weatherData.current_weather.weathercode;

      // Relative Luftfeuchtigkeit für die aktuelle Stunde
      const currentHourIndex = this.weatherData.hourly.time.findIndex((t: string) => {
        const date = new Date(t);
        return date.getHours() === currentHour && date.getDate() === now.getDate();
      });

      if (currentHourIndex >= 0 && this.weatherData.hourly.relative_humidity_2m) {
        this.currentHumidity = this.weatherData.hourly.relative_humidity_2m[currentHourIndex];
      } else {
        console.warn("Keine Luftfeuchtigkeitsdaten für die aktuelle Stunde verfügbar.");
        this.currentHumidity = undefined; // Optional: Standardwert setzen
      }
    }

    // Stündliche Wetterdaten filtern
    this.hourlyData = this.weatherData.hourly.time
      .map((time: string, index: number) => {
        return {
          time: new Date(time),
          temperature: this.weatherData.hourly.temperature_2m[index],
          weathercode: this.weatherData.hourly.weathercode[index]
        };
      })
      .filter((item: any) => {
        return item.time.getDate() === now.getDate() &&
          item.time.getHours() >= currentHour &&
          item.time.getHours() <= currentHour + 4;
      });

    console.log("Gefilterte stündliche Daten:", this.hourlyData);

    // Tägliche Wetterdaten für die nächsten 5 Tage
    this.dailyData = {
      time: this.weatherData.daily.time.slice(0, 5),
      temperature_2m_max: this.weatherData.daily.temperature_2m_max.slice(0, 5),
      temperature_2m_min: this.weatherData.daily.temperature_2m_min.slice(0, 5),
      weathercode: this.weatherData.daily.weathercode.slice(0, 5)
    };

    console.log("Tägliche Wetterdaten für die nächsten 5 Tage:", this.dailyData);
    this.renderDailyWeatherChart();
  }



  getWeatherDescription(code: number): string {
    return this.weatherCodes[code.toString()] || 'Unbekanntes Wetter';
  }

  getWeatherIcon(code: number): string {
    return this.iconMapping[code.toString()] || 'fas fa-question';
  }

  getMonthlyWeather():void{
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(),1).toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    this.weatherService.getMonthlyWeatherForecast(this.latitude, this.longitude, startDate, endDate).subscribe(
      (data) => {
        this.aggregateMonthlyWeather(data.daily.weathercode);
        this.renderMonthlyWeatherChart();
        this.renderDailyWeatherChart();
      },
      (error) => {
        this.errorMessage = 'Fehler beim Abrufen der Monatswetterdaten';
        console.error(this.errorMessage, error);
      }
    );
  }

  aggregateMonthlyWeather(weatherCodes: number[]): void{
    this.monthlyWeatherSummary = { sunny: 0, cloudy: 0, rainy: 0 };

    weatherCodes.forEach((code) => {
      if ([0, 1].includes(code)) this.monthlyWeatherSummary.sunny++;
      else if ([2, 3].includes(code)) this.monthlyWeatherSummary.cloudy++;
      else if ([61, 63, 65].includes(code)) this.monthlyWeatherSummary.rainy++;
    });

    console.log('Wetterzusammenfassung für den Monat:', this.monthlyWeatherSummary);
  }

  renderMonthlyWeatherChart(): void {
    const ctx = document.getElementById('monthlyWeatherChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Sonnig', 'Bewölkt', 'Regnerisch'],
        datasets: [
          {
            data: [
              this.monthlyWeatherSummary.sunny,
              this.monthlyWeatherSummary.cloudy,
              this.monthlyWeatherSummary.rainy
            ],
            backgroundColor: ['#FFD700', '#C0C0C0', '#87CEEB'] // Farben für sonnig, bewölkt, regnerisch
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true
          }
        },
        responsive: false,
        maintainAspectRatio: true
      }
    });
  }

  renderDailyWeatherChart(): void {
    const ctx = document.getElementById('dailyWeatherChart') as HTMLCanvasElement;

    ctx.height = 400; // Höhe in Pixel
    ctx.width = ctx.parentElement?.clientWidth || 800;

    if (!ctx) {
      console.error("Canvas für den täglichen Wetterverlauf nicht gefunden");
      return;
    }

    if (
      !this.dailyData ||
      !this.dailyData.time ||
      !this.dailyData.temperature_2m_max ||
      !this.dailyData.temperature_2m_min ||
      this.dailyData.time.length !== this.dailyData.temperature_2m_max.length ||
      this.dailyData.time.length !== this.dailyData.temperature_2m_min.length
    ) {
      console.error("Ungültige Daten für den täglichen Wetterverlauf", this.dailyData);
      return;
    }

    console.log("Daily Data Time:", this.dailyData.time);
    console.log("Max Temp:", this.dailyData.temperature_2m_max);
    console.log("Min Temp:", this.dailyData.temperature_2m_min);

    // Canvas-Größe zurücksetzen
    ctx.width = ctx.width;

    // Sicherstellen, dass vorherige Chart-Instanz gelöscht wird
    Chart.getChart(ctx)?.destroy();

    // Neuen Chart erstellen
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.dailyData.time.map((t: string) =>
          new Date(t).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })
        ),
        datasets: [
          {
            label: 'Max Temperatur (°C)',
            data: this.dailyData.temperature_2m_max,
            borderColor: '#ff7e5f',
            backgroundColor: 'rgba(255, 126, 95, 0.2)',
            tension: 0.4, // Glättung der Linie
            fill: true,
          },
          {
            label: 'Min Temperatur (°C)',
            data: this.dailyData.temperature_2m_min,
            borderColor: '#6baed6',
            backgroundColor: 'rgba(107, 174, 214, 0.2)',
            tension: 0.4, // Glättung der Linie
            fill: true,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Datum',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Temperatur (°C)',
            },
            beginAtZero: false,
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
          },
        },
      },
    });
  }


  setCurrentMonth(): void {
    const today = new Date();
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = monthNames[today.getMonth()]; // Aktueller Monat
  }

  getWeatherGif(condition: string): string {
    return this.weatherGifs[condition] || this.weatherGifs['unknown'];
  }

  getWeatherCondition(code: number): string {
    if ([0, 1].includes(code)) return 'sunny';
    if ([2, 3].includes(code)) return 'cloudy';
    if ([61, 63, 65].includes(code)) return 'rainy';
    if ([66, 67, 71, 73, 75].includes(code)) return 'snowy'; // Schnee-Codes
    return 'unknown';
  }

}

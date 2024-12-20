import { Component, OnInit } from '@angular/core';
import { Graph } from "../model/Graph";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { HttpClient} from "@angular/common/http";
import { NgForOf, NgIf } from "@angular/common";
import { GraphComponent } from "../graph/graph.component";
import { FormsModule } from '@angular/forms';
import { Subscription, timer } from 'rxjs';
import { Duration } from '../model/Duration';
import {WeatherComponent} from "../weather/weather.component";

@Component({
  selector: 'app-graph-overview',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    GraphComponent,
    FormsModule,
    WeatherComponent,
  ],
  templateUrl: './graph-overview.component.html',
  styleUrls: ['./graph-overview.component.css']
})
export class GraphOverviewComponent implements OnInit {
  public graphs: Graph[] = [];
  public currentIndex = -1;
  public currentGraph: Graph | null = null;

  public kioskMode: boolean = true;
  public interval: number = 15;
  subscription!: Subscription;

  public durations: Duration[] = [
    new Duration("5m", "5 minutes"),
    new Duration("1h", "1 hour"),
    new Duration("4h", "4 hours"),
    new Duration("1d", "1 day"),
    new Duration("2d", "2 days"),
    new Duration("7d", "1 week"),
    new Duration("30d", "1 month"),
    new Duration("365d", "1 year")
  ];
  public selectedDuration: Duration = this.durations[3];

  public visible: boolean = false;

  // Monate und Auswahl
  public months: string[] = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];
  public selectedMonth: number = new Date().getMonth(); // Aktueller Monat als Standard

  constructor(public sanitizer: DomSanitizer, public http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<Graph[]>('assets/data/graph-data.json').subscribe((data) => {
      this.graphs = data;
      console.log(this.graphs.length + " graphs loaded");
    });

    this.kioskModeChecker();
    this.changeDuration();
    this.updateGraphLinks();
  }

  public selectAllGraphs(): void {
    this.currentIndex = -1;
    this.currentGraph = null; // Zeigt alle Graphen an, wenn Dashboard ausgewählt ist
  }

  public selectGraph(index: number): void {
    this.setCurrentGraphWithIndex(index);
  }

  public kioskModeChecker() {
    if (this.kioskMode) {
      this.activateKioskMode();
    } else {
      this.deactivateKioskMode();
    }
  }

  public activateKioskMode(): void {
    this.subscription = timer(0, this.interval * 1000).subscribe(() => {
      this.nextGraph();
    });
  }

  public deactivateKioskMode(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public nextGraph(): void {
    // Inkrementiere den Index
    this.currentIndex++;

    // Wenn das Ende der Liste erreicht ist, schalte zu Wetter
    if (this.currentIndex >= this.graphs.length) {
      this.currentIndex = -2; // Wechsel zu Wetter
    }

    // Wechsel zu Wetter oder Graphen
    if (this.currentIndex === -2) {
      this.selectWeather();
    } else {
      this.setCurrentGraphWithIndex(this.currentIndex);
    }
  }

  calculateStartAndEndOfMonth(month: number): { from: number, to: number } {
    const desiredYear = 2024;

    const startDate = new Date(desiredYear, month, 1, 0, 0, 0, 0);
    const endDate = new Date(desiredYear, month + 1, 0, 23, 59, 59, 999);

    const from = startDate.getTime();
    const to = endDate.getTime();

    return { from, to };
  }



  public selectMonth(): void {
    const { from, to } = this.calculateStartAndEndOfMonth(this.selectedMonth);

    this.graphs.forEach(graph => {
      if (graph.iFrameLink.includes("from=") && graph.iFrameLink.includes("to=")) {
        graph.iFrameLink = graph.iFrameLink
          .replace(/from=[^&]+/, `from=${from}`)
          .replace(/to=[^&]+/, `to=${to}`);
      } else if (graph.iFrameLink.includes("from=") && !graph.iFrameLink.includes("to=")) {
        graph.iFrameLink += `&to=${to}`;
      } else if (!graph.iFrameLink.includes("from=") && graph.iFrameLink.includes("to=")) {
        graph.iFrameLink += `&from=${from}`;
      } else {
        graph.iFrameLink += `&from=${from}&to=${to}`;
      }

      console.log(`Updated Graph Link for Month: ${graph.iFrameLink}`);
    });

    this.updateCurrentGraph(); // Aktualisiert den aktuellen Graph
  }


  private updateCurrentGraph(): void {
    if (this.currentIndex !== -1) {
      this.setCurrentGraphWithIndex(this.currentIndex); // Aktualisiert den aktuellen Graph
    } else {
      this.currentGraph = null; // Zeigt alle Graphen an, falls kein spezifischer ausgewählt ist
    }
  }



  public changeDuration(): void {
    const selectedDuration: string = this.selectedDuration.short;

    this.graphs.forEach(graph => {
      if (graph.iFrameLink.includes("from=now") && graph.iFrameLink.includes("to=now")) {
        graph.iFrameLink = graph.iFrameLink.replace(/from=now-\w+/, `from=now-${selectedDuration}`);
      } else {
        graph.iFrameLink += `&from=now-${selectedDuration}&to=now`;
      }
      console.log(`Updated Graph Link for Duration: ${graph.iFrameLink}`);
    });

    this.updateCurrentGraph();
  }


  private updateGraphLinks(): void {
    const { from, to } = this.calculateStartAndEndOfMonth(this.selectedMonth);
    const selectedDuration: string = this.selectedDuration.short;

    this.graphs.forEach(graph => {
      if (graph.iFrameLink.includes("from=now")) {
        // Aktualisiert relative Zeitangaben (bei "now" basierten Links)
        graph.iFrameLink = graph.iFrameLink.replace(/from=now-\w+/, `from=now-${selectedDuration}`);
      } else if (graph.iFrameLink.includes("from=") && graph.iFrameLink.includes("to=")) {
        // Aktualisiert absolute Zeitangaben (bei "from" und "to" vorhandenen Links)
        graph.iFrameLink = graph.iFrameLink
          .replace(/from=\d+/, `from=${from}`)
          .replace(/to=\d+/, `to=${to}`);
      } else {
        // Fügt `from` und `to` hinzu, falls sie nicht vorhanden sind
        graph.iFrameLink += `&from=${from}&to=${to}`;
      }
      console.log(`Updated Graph Link: ${graph.iFrameLink}`);
    });

    this.updateCurrentGraph(); // Aktualisiert den aktuellen Graph
  }


  public setCurrentGraphWithIndex(index: number): void {
    this.currentIndex = index;
    if (index >= 0 && index < this.graphs.length) {
      this.currentGraph = this.graphs[index];
    } else {
      this.currentGraph = null;
    }
  }

  public getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  public toggleCollapse() {
    this.visible = !this.visible;
  }

  public getAllGraphNames(graphs: Graph[], separator: string): string {
    let res: string[] = [];

    graphs.forEach(g => {
      res.push(g.name);
    });

    return res.join(separator);
  }

  public selectWeather(): void {
    this.currentIndex = -2; // Spezieller Index für Wetter
    this.currentGraph = null; // Kein Graph wird angezeigt
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { GeoJSONFeature } from '../models/interfaces';
import { LoadService } from './load.service';
import { ParseService } from './parse.service';


@Injectable({
  providedIn: 'root'
})
export class LayerService {
  regions: string = '/assets/data/regions.geojson';
  regionsLayer: any;

  departements: string = '/assets/data/departements.geojson';
  departementsLayer: any;

  allEnlLiv: string = '/assets/data/all_enlliv.json';
  allEnlLivLayer: any;

  cantons: string = '/assets/data/cantons.geojson';
  cantonsLayer: any;

  dotscloud: string = '/assets/data/enlevement.geojson';
  dotscloudLayer: any;

  vehData: string = '/assets/data/vehiculesData.json';
  vehDataLayer: any;

  circleMarkers: L.CircleMarker[] = [];
  markersWithText: L.Marker[] = [];
  dotsMarkers: L.CircleMarker[] = [];

  features: GeoJSONFeature[] = [];

  mappedDot = new Map<string, number>();

  style = {
    color: '#60A3D9',
    stroke: true,
    weight: 2,
    opacity: .8
  }


  constructor(private http: HttpClient,
    private loadService: LoadService,
    private parseService: ParseService) { }
  

  private removeLayers(layers: any[], map: L.Map): void {
    layers.forEach(layer => {
      if (layer) {
        layer.removeFrom(map);
      }
    });
  }

  makeDotsLayer(map: L.Map, mapData: Map<any, any>) {
    mapData.forEach((value, key) => {
      this.dotscloudLayer = L.GeoJSON.geometryToLayer(value.feature, {
        style: this.style,
        pointToLayer: (feature, latlng) => {
          const marker = this.createCircleMarker(latlng, 'green', 10)
          this.dotsMarkers.push(marker as any);
          return (marker);
        },
      }).bindPopup(JSON.stringify(value.feature.properties) + value.total).addTo(map);
    })
  }

  removeValueLayer(map: L.Map) {
    if (this.circleMarkers.length > 0) {
      this.removeLayers(this.circleMarkers, map);
      this.circleMarkers = [];
    }

    if (this.markersWithText.length > 0) {
      this.removeLayers(this.markersWithText, map);
      this.markersWithText = [];
    }
  }

  removeAllLayers(map: L.Map): void {
    const layers = [this.regionsLayer, this.departementsLayer, this.cantonsLayer, this.dotscloudLayer];
    this.removeLayers(layers, map);
    if (this.circleMarkers.length > 0) {
      this.removeLayers(this.circleMarkers, map);
      this.circleMarkers = [];
    }

    if (this.markersWithText.length > 0) {
      this.removeLayers(this.markersWithText, map);
      this.markersWithText = [];
    }
    if (this.dotsMarkers.length > 0) {
      this.removeLayers(this.dotsMarkers, map);
      this.dotsMarkers = [];
    }
  }

  private createCircleMarker(center: L.LatLngExpression, color: string, radius: number = 30): L.CircleMarker {
    return L.circleMarker(center, {
      radius: radius,
      color: color,
      opacity: 1,
      stroke: false,
      fillOpacity: 1,
    });
  }

  private createMarkerWithText(center: L.LatLngExpression, value: any): L.Marker {
    return L.marker(center, {
      icon: L.divIcon({
        html: `<div style="margin-top: -0.2em;">${value.total}</div>`,
        className: 'circle-label',
      }),
    });
  }

  private computeTotalVehs(value: any[]) : number {
    let total: number = 0;
    value.forEach((item) => {
      total += item.total
    })
    return total;
  }

  private addCircleToLayer(map: L.Map, layer: L.Layer, color: string, value: any, option?: string): void {
    const layerCenter = (layer as any).getBounds().getCenter();
    const circleMarker = this.createCircleMarker(layerCenter, color)
      .bindPopup(`Nombres de concessions : ${value.total}</br>
                  Total vehicules: ${this.computeTotalVehs(value.concessions)}`);
    this.circleMarkers.push(circleMarker);

    // circleMarker.on('dblclick', () => {
    //   this.zoomIn(map, layer, option);
    // });

    const markerWithText = this.createMarkerWithText(layerCenter, value);
    this.markersWithText.push(markerWithText);

    L.layerGroup([circleMarker, markerWithText]).addTo(map);
  }

  private getLayerByName(layers: any[], name: string): any {
    return layers.find(layer => layer['feature'].properties['nom'] === name);
  }

  displayValue(map: L.Map, layerName: string, mappedDot: Map<string, any>): void {
    mappedDot.forEach((value, key) => {
      if (layerName === 'regions') {
        this.addCircleToRegions(map, key, value);
      } else if (layerName === 'departements') {
        this.addCircleToDepartements(map, key, value);
      }
    });
  }

  displayValueRegions(map: L.Map, mappedDot: Map<string, number>): void {
    this.displayValue(map, 'regions', mappedDot);
  }

  displayValueDepartements(map: L.Map, mappedDot: Map<string, number>): void {
    this.displayValue(map, 'departements', mappedDot);
  }

  addCircleToRegions(map: L.Map, regionName: string, value: any): void {
    const regionLayer = this.getLayerByName(this.regionsLayer.getLayers(), regionName);
    if (regionLayer) {
      this.addCircleToLayer(map, regionLayer, '#E63946', value, "region");
    } else {
      console.error(`Region "${regionName}" not found.`);
    }
  }

  addCircleToDepartements(map: L.Map, departementName: string, value: number): void {
    const departementLayer = this.getLayerByName(this.departementsLayer.getLayers(), departementName);
    if (departementLayer) {
      this.addCircleToLayer(map, departementLayer, 'orange', value, "departement");
    } else {
      console.error(`Departement "${departementName}" not found.`);
    }
  }

  async makeRegionLayers(map: L.Map) {
    if (this.regionsLayer) {
      this.regionsLayer.addTo(map);
    } else {
      this.loadService.loadGeoJSON(this.regions).then((res) => {
        this.regionsLayer = L.geoJSON(res, {
          style: this.style,
        }).addTo(map);
      });
    }
  }

  makeDepartementsLayers(map: L.Map): void {
    if (this.departementsLayer) {
      this.departementsLayer.addTo(map);
    } else {
      this.loadService.loadGeoJSON(this.departements).then((res) => {
        this.departementsLayer = L.geoJSON(res, {
          style: this.style,
        }).addTo(map);
      });
    }
  }

  makeCantonsLayers(map: L.Map): void {
    if (this.cantonsLayer) {
      this.cantonsLayer.addTo(map);
    } else {
      this.loadService.loadGeoJSON(this.cantons).then((res) => {
        this.cantonsLayer = L.geoJSON(res, {
          style: this.style,
        }).addTo(map);
      });
    }
  }
}
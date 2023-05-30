import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { LayerService } from './services/layer.service';
import { ParseService } from './services/parse.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  map: L.Map;

  regions: string = '/assets/data/regions.geojson';

  departements: string = '/assets/data/departements.geojson';

  allEnlLiv: string = '/assets/data/all_enlliv.json';

  vehData: string = '/assets/data/vehiculesData.json';

  mapData: Map<string, any> = new Map<string, any>();

  constructor(private layerService: LayerService,
    private parseService: ParseService) { }

    async ngAfterViewInit() {
      this.initMap();
      this.layerService.makeRegionLayers(this.map);
      await this.parseData();
      this.updateMap('regions', this.regions);
      this.map.on('zoomend', async () => {
        const zoomLevel = this.map.getZoom();
        if (zoomLevel < 8) {
          this.layerService.removeAllLayers(this.map);
          this.layerService.makeRegionLayers(this.map);
          await this.updateMap('regions', this.regions);
        } else if (zoomLevel >= 8 && zoomLevel <= 9) {
          this.layerService.removeAllLayers(this.map);
          this.layerService.makeDepartementsLayers(this.map);
          await this.updateMap('departements', this.departements);
        } else if (zoomLevel > 9 && zoomLevel <= 12) {
          this.layerService.removeValueLayer(this.map);
          this.layerService.makeDotsLayer(this.map, this.mapData);
        }
      });
  }
  

  async updateMap(layerName: string, layerPath: string) {
    if (this.mapData.size === 0)
      await this.parseData();
    const features = this.parseService.extractFeatures(this.mapData);
    return this.parseService.parsePointsAndCheckRegions(features, layerPath)
      .then((mappedEnl) => {
        this.layerService.displayValue(this.map, layerName, mappedEnl);
      })
      .catch(err => console.error(err));
  }

  async parseData() {
    console.log("parse data");
    return this.parseService.parseLieuEnlevementJSON(this.allEnlLiv, this.map)
      .then(() => this.parseService.parseVehicules(this.vehData, this.map))
      .then((mapData) => this.mapData = mapData);
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [47, 2],
      zoom: 6
    });
    L.tileLayer('https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?apiKey={accessToken}&style=silica', {
      maxZoom: 13,
      minZoom: 5,
      accessToken: 'RVVfM2M0OTZjZDJiN2FkNDNlNGI3ODEwN2ZhYzhiNGI2YzM6ZTA4YzdiY2EtMjc1ZS00OTNkLTg4ZjEtZjEwOGNhYzc5NjBh',
    }).addTo(this.map);
  }
}


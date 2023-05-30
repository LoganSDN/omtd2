import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GeoJSON, JSONData } from '../models/interfaces';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoadService {

  constructor(private http: HttpClient) { }

  loadGeoJSON(url: string): Promise<any> {
    return firstValueFrom(this.http.get<GeoJSON>(url));
  }

  loadJSON(url: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(url));
  }

  async loadNameData(layer: L.Layer, regionLayer: any) {
    const lat = layer['feature'].geometry.coordinates[1];
    const lon = layer['feature'].geometry.coordinates[0];
    console.log(`lat : ${lat}, lon : ${lon}`);
    const properties = await firstValueFrom(this.http.get(`https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lon}&type=street`))
    if (properties['features'].length > 0) {
      return properties['features'][0].properties.label;
    }
    else
      return "No information provided by API"
  }
}

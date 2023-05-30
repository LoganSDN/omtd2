import { Injectable } from '@angular/core';
import { LoadService } from './load.service';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { firstValueFrom } from 'rxjs';
import { GeoJSONFeature, GeoJSON, JSONData, JSONVehData, finalData } from '../models/interfaces';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ParseService {
  style = {
    color: '#FFC107',
    stroke: true,
    weight: 2,
    opacity: .9
  }

  mapData: Map<string, any> = new Map<string, any>();

  constructor(private loadService: LoadService,
    private http: HttpClient) { }

    async parsePointsAndCheckRegions(activeEnlFeatures: GeoJSONFeature[], regionOrDepPath: string): Promise<Map<string, any>> {
      try {
          const regionOrDepRes = await this.loadService.loadGeoJSON(regionOrDepPath);
          let mappedDot = new Map<string, any>();
          const points = turf.featureCollection(activeEnlFeatures as turf.Feature[]);
          const regions = turf.featureCollection(regionOrDepRes.features);
  
          let mapDataLookup = new Map();
          for (let [key, value] of this.mapData.entries()) {
              for (let veh of value.vehs) {
                  mapDataLookup.set(veh.enlRaison_social_site, { key, value });
              }
          }
  
          turf.featureEach(points, (point) => {
              const raison_social_site = point.properties['raison_social_site'];
              const mapDataItem = mapDataLookup.get(raison_social_site);
  
              if (!mapDataItem) {
                  console.log(`No mapData item found for raison_social_site: ${raison_social_site}`);
                  return;
              }
  
              turf.featureEach(regions, (region) => {
                  if (turf.booleanWithin(point, region)) {
                      const regionName = region.properties['nom'];
                      if (mappedDot.has(regionName)) {
                          let currentRegion = mappedDot.get(regionName);
                          currentRegion.total += 1;
                          currentRegion.concessions.push(mapDataItem.value);
                          mappedDot.set(regionName, currentRegion);
                      } else {
                          mappedDot.set(regionName, {
                              total: 1,
                              concessions: [mapDataItem.value]
                          });
                      }
                  }
              });
          });
  
          return mappedDot;
      } catch (error) {
          console.error('Error loading data:', error);
          return null;
      }
  }

  // async parsePointsAndCheckDepartements(activeEnlFeatures: GeoJSONFeature[], regionPath: string, regionCode: number): Promise<Map<string, number>> {
  //   try {
  //     const departementsList = await firstValueFrom(this.http.get<Array<any>>(`https://geo.api.gouv.fr/regions/${regionCode}/departements`));
  //     const departementsRes = await this.loadService.loadGeoJSON(regionPath);
  //     let mappedDot = new Map<string, number>();
  //     const points = turf.featureCollection(activeEnlFeatures as turf.Feature[]);
  //     const departements = turf.featureCollection(departementsRes.features);
  //     turf.featureEach(points, (point) => {
  //       turf.featureEach(departements, (departement) => {
  //         if (turf.booleanWithin(point, departement)) {
  //           departementsList.forEach((dep) => {
  //             if (dep.nom === departement.properties['nom']) {
  //               const departementName = departement.properties['nom'];
  //               mappedDot.set(departementName, (mappedDot.get(departementName) || 0) + 1);
  //             }
  //           });
  //         }
  //       });
  //     });
  //     return mappedDot;
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     return null;
  //   }
  // }
  

  async parseLieuEnlevementJSON(allEnlLivPath: string, map: L.Map) {
    const data: JSONData = await this.loadService.loadJSON(allEnlLivPath);
    const features: GeoJSONFeature[] = [];
    const mapData: Map<string, any> = new Map<string, any>();

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const item = data[key];
        const feature = {
          type: 'Feature',
          properties: {
            oid: item.oid,
            ligne_addr1: item.ligne_adr1,
            ligne_addr2: item.ligne_adr2,
            raison_social_site: item.raison_social_site,
            code_postal: item.code_postal,
          },
          geometry: {
            type: 'Point',
            coordinates: [item.longitude, item.latitude]
          }
        };
        features.push(feature);
        mapData.set(item.oid, { feature: feature, total: 0, vehs: [] });
      }
    }
    const geoJSON: GeoJSON = {
      type: 'FeatureCollection',
      features: features
    };
    this.mapData = mapData;
  }

  async parseVehicules(vehPath: string, map: L.Map): Promise<any> {
    const vehData: JSONVehData = await this.loadService.loadJSON(vehPath);
    let i = 0;
    for (const key in vehData) {
      if (Object.prototype.hasOwnProperty.call(vehData, key)) {
        const item = vehData[key];
        this.mapData.forEach((_item) => {
          const element = _item.feature.properties.raison_social_site;
          if (item.enlRaison_social_site === element) {
            _item.total += 1;
            _item.vehs.push(item);
          }
        });
      }
    }
    this.mapData.forEach((value, key) => {
      if (value.total === 0)
        this.mapData.delete(key);
      })
    return this.mapData;
  }

  extractFeatures(map: Map<string, any>): GeoJSONFeature[] {
    let features: GeoJSONFeature[] = [];
    map.forEach((_item) => {
      features.push(_item.feature);
    });
    return features;
  }

  transformToGeoJSON(data: JSONVehData): GeoJSON {
    const features = Object.values(data).map(item => {
      const coordinates = [[item['enlLongitude'], item['enlLatitude']], [item['livLongitude'], item['livLatitude']]];

      const properties = {
        veh: item['veh'],
        oid: item['oid'],
        marque: item['marque'],
        modele: item['modele'],
        enlRaison_social_site: item['enlRaison_social_site'],
        enlAdresse: item['enlAdresse'],
        enlCode_postal: item['enlCode_postal'],
        livRaison_social_site: item['livRaison_social_site'],
        livAdresse: item['livAdresse'],
        livCode_postal: item['livCode_postal']
      };

      return {
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: coordinates
        },
        properties: properties
      };
    });

    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };
    return geoJSON;
  }

  setupFinalData() {
  }
}

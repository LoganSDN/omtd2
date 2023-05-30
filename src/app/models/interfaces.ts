export interface GeoJSONFeature {
	type: string;
	properties: any;
	geometry: any;
}

export interface GeoJSON {
	type: string;
	features: GeoJSONFeature[];
}

export interface JSONData {
	[key: string]: {""
		raison_social_site: string;
		code_postal: string;
		oid: string;
		ligne_adr1: string;
		ligne_adr2: string;
		longitude: number;
		latitude: number;
		geoJSON: GeoJSON;
		total: number;
	};
}

export interface JSONVehData {
	[key: string]: {
		veh: string,
		oid: string,
		marque: string,
		modele: string,
		enloid: number;
		enlLatitude: number,
		enlLongitude: number,
		enlRaison_social_site: string,
		enlAdresse: string,
		enlCode_postal: string,
		livoid: number;
		livLatitude: number,
		livLongitude: number,
		livRaison_social_site: string,
		livAdresse: string,
		livCode_postal: string
	};
}

export interface finalData {
	[key: string]: {
    [x: string]: any;
		vehs: JSONVehData[],
		data: JSONData,
		total: number
	}
}
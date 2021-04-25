import { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Marker,
  Popup,
} from "react-leaflet";
import osm from "./osm-providers";
import axios from "axios";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "./App.css";
import osmtogeojson from "osmtogeojson";

const App = () => {
  const [center, setCenter] = useState({ lat: 52.501746, lng: 13.391767 });
  const [mapLayers, setMapLayers] = useState([]);
  const [featuresData, setFeatures] = useState([]);

  const ZOOM_LEVEL = 12;
  const mapRef = useRef();

  const _onCreate = (e) => {
    console.log(e);

    const { layerType, layer } = e;
    if (layerType === "rectangle") {
      const { _leaflet_id } = layer;

      setMapLayers((layers) => [
        ...layers,
        { id: _leaflet_id, latlngs: layer.getLatLngs()[0] },
      ]);
    }
  };

  const _onEdited = (e) => {
    console.log(e);
    const {
      layers: { _layers },
    } = e;

    Object.values(_layers).map(({ _leaflet_id, editing }) => {
      return setMapLayers((layers) =>
        layers.map((l) =>
          l.id === _leaflet_id
            ? { ...l, latlngs: { ...editing.latlngs[0] } }
            : l
        )
      );
    });
  };

  const _onDeleted = (e) => {
    console.log(e);
    const {
      layers: { _layers },
    } = e;

    Object.values(_layers).map(({ _leaflet_id }) => {
      return setMapLayers((layers) =>
        layers.filter((l) => l.id !== _leaflet_id)
      );
    });
  };

  console.log(mapLayers);

  const getFeaturesDetail = () => {
    const geoData1 = mapLayers[0].latlngs[1];
    const geoData2 = mapLayers[0].latlngs[3];
    axios
      .get(
        `https://www.openstreetmap.org/api/0.6/map?bbox=${geoData1.lng},${geoData2.lat},${geoData2.lng},${geoData1.lat}`
      )
      .then(
        (response) => {
          const featuresData = osmtogeojson(response.data);

          setFeatures(featuresData.features);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  useEffect(() => {
    if (mapLayers.length > 0) {
      getFeaturesDetail();
    }
  }, [mapLayers]);

  const getGeoPoints = (featureData) => {
    const featureType = featureData.geometry.type;
    if (featureType === "Point")
      return [
        featureData.geometry.coordinates[1],
        featureData.geometry.coordinates[0],
      ];
    return featureData.geometry.type === "LineString"
      ? [
          featureData.geometry.coordinates[0][1],
          featureData.geometry.coordinates[0][0],
        ]
      : [
          featureData.geometry.coordinates[0][0][1],
          featureData.geometry.coordinates[0][0][0],
        ];
  };

  return (
    <div id="mapid">
      <MapContainer center={center} zoom={13}>
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={_onCreate}
            onEdited={_onEdited}
            onDeleted={_onDeleted}
            draw={{
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polygon: false,
            }}
          />
        </FeatureGroup>

        <TileLayer
          url={osm.maptiler.url}
          attribution={osm.maptiler.attribution}
        />
        {featuresData.map((featureData) => {
          const position = getGeoPoints(featureData);
          return (
            <Marker position={position}>
              <Popup>
                A pretty CSS3 popup. <br /> Easily customizable.
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <pre className="text-left">{JSON.stringify(mapLayers)}</pre>
    </div>
  );
};

export default App;

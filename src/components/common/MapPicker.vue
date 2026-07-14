<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

import Location from '@/assets/icons/Location.vue';
import icon from 'leaflet/dist/images/marker-icon.png';
import MainButton from '@/components/common/MainButton.vue';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const props = withDefaults(
    defineProps<{
        lat?: string | number;
        lng?: string | number;
        height?: string;
        zoom?: number;
    }>(),
    {
        lat: 9.0122,
        lng: 38.7578,
        height: '256px',
        zoom: 13
    }
);

const emit = defineEmits<{
    (e: 'update:location', coords: { lat: string; lng: string }): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const initMap = () => {
    if (!mapContainer.value) return;

    if (map) {
        map.remove();
    }

    const startLat = parseFloat(props.lat.toString()) || 9.0122;
    const startLng = parseFloat(props.lng.toString()) || 38.7578;

    map = L.map(mapContainer.value).setView([startLat, startLng], props.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    marker = L.marker([startLat, startLng], { icon: DefaultIcon }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const coords = { lat: lat.toFixed(6), lng: lng.toFixed(6) };

        marker?.setLatLng([lat, lng]);
        emit('update:location', coords);
    });

    map.on('locationfound', (e: L.LocationEvent) => {
        const { lat, lng } = e.latlng;

        marker?.setLatLng([lat, lng]);

        emit('update:location', {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6)
        });

        map?.setView([lat, lng], 18);
    });
    setTimeout(() => {
        map?.invalidateSize();
    }, 200);
};
watch(
    () => [props.lat, props.lng],
    ([newLat, newLng]) => {
        if (map && marker) {
            const lat = parseFloat(String(newLat));
            const lng = parseFloat(String(newLng));

            if (!isNaN(lat) && !isNaN(lng)) {
                marker.setLatLng([lat, lng]);
                map.panTo([lat, lng]);
            }
        }
    }
);

const locateUser = () => {
    map?.locate({
        setView: true,
        maxZoom: 13,
        enableHighAccuracy: true
    });
};
onMounted(() => {
    nextTick(() => {
        initMap();
    });
});

onUnmounted(() => {
    if (map) {
        map.remove();
    }
});
</script>

<template>
    <div
        class="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
        :style="{ height: height }">
        <div
            ref="mapContainer"
            class="relative z-0 h-full w-full"></div>
        <div class="bg-schedule-generic-white absolute top-0 right-0 rounded-xl">
            <MainButton
                @click="locateUser"
                outlined
                :icon="Location" />
        </div>
    </div>
</template>

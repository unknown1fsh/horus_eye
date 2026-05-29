package com.scinar.horuseye.util;

import lombok.experimental.UtilityClass;

@UtilityClass
public class GeoUtils {

    public static double[] latLngToWorldPosition(double latitude, double longitude, double radius) {
        double latRad = Math.toRadians(latitude);
        double lonRad = Math.toRadians(longitude);
        double x = radius * Math.cos(latRad) * Math.cos(lonRad);
        double y = radius * Math.sin(latRad);
        double z = radius * Math.cos(latRad) * Math.sin(lonRad);
        return new double[]{x, y, z};
    }

    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

package com.zai.backend.dto;

import com.zai.backend.entity.Series;

public record SeriesDto(
        Long id,
        String name,
        Double minValue,
        Double maxValue,
        String color,
        String icon,
        String unit
) {

    public static SeriesDto from(Series series) {
        return new SeriesDto(
                series.getId(),
                series.getName(),
                series.getMinValue(),
                series.getMaxValue(),
                series.getColor(),
                series.getIcon(),
                series.getUnit());
    }
}

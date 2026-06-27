import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface SkillData {
  label: string;
  value: number; // 0-5
  isNA?: boolean;
}

interface RadarChartProps {
  skills: SkillData[];
  size?: number;
}

export function RadarChart({ skills, size = 260 }: RadarChartProps) {
  const c = useColors();
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35;
  const levels = 5;
  const n = skills.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const polarToXY = (radius: number, index: number) => {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  // Build polygon points from values
  const polygonPoints = skills
    .map((skill, i) => {
      const r = skill.isNA ? 0 : (skill.value / 5) * maxR;
      const { x, y } = polarToXY(r, i);
      return `${x},${y}`;
    })
    .join(" ");

  // Label positions (slightly outside the chart)
  const labelR = maxR + 22;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circles */}
        {Array.from({ length: levels }).map((_, level) => {
          const r = ((level + 1) / levels) * maxR;
          const pts = Array.from({ length: n })
            .map((_, i) => {
              const { x, y } = polarToXY(r, i);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <Polygon
              key={`bg-${level}`}
              points={pts}
              fill="none"
              stroke={c.primary100}
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {skills.map((_, i) => {
          const { x, y } = polarToXY(maxR, i);
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={c.primary100}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={polygonPoints}
          fill={`${c.primary500}25`}
          stroke={c.primary500}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {skills.map((skill, i) => {
          if (skill.isNA || skill.value === 0) return null;
          const r = (skill.value / 5) * maxR;
          const { x, y } = polarToXY(r, i);
          return (
            <Circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill={c.primary500}
            />
          );
        })}

        {/* Labels */}
        {skills.map((skill, i) => {
          const { x, y } = polarToXY(labelR, i);
          const isNA = skill.isNA;

          // Adjust text anchor based on position
          let anchor: "start" | "middle" | "end" = "middle";
          const dx = x - cx;
          if (dx > 10) anchor = "start";
          if (dx < -10) anchor = "end";

          return (
            <SvgText
              key={`label-${i}`}
              x={x}
              y={y + 4}
              fontSize="9"
              fill={isNA ? c.textDisabled : c.textSecondary}
              textAnchor={anchor}
              fontFamily="Inter_500Medium"
            >
              {skill.label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {skills.map((skill) => (
          <View key={skill.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: skill.isNA ? "#D1D5DB" : c.primary500 },
              ]}
            />
            <Text style={[styles.legendText, { color: c.textSecondary }]}>
              {skill.label}: {skill.isNA ? "N/A" : `${skill.value}/5`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});

def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


class ReadingGenerator:
    """Smooth random walk around a threshold, with occasional anomalies.

    A random.Random instance is injected so runs are reproducible and testable.
    """

    def __init__(
        self,
        temp_threshold: float,
        humidity_threshold: float,
        temp_tolerance: float,
        humidity_tolerance: float,
        anomaly_probability: float,
        rng,
    ):
        self.temp_threshold = temp_threshold
        self.humidity_threshold = humidity_threshold
        self.temp_tolerance = temp_tolerance
        self.humidity_tolerance = humidity_tolerance
        self.anomaly_probability = anomaly_probability
        self.rng = rng
        self._temp = temp_threshold
        self._hum = humidity_threshold

    def next(self) -> tuple[float, float]:
        # Random walk with gentle mean reversion toward the threshold.
        self._temp += self.rng.uniform(-0.4, 0.4) + (self.temp_threshold - self._temp) * 0.05
        self._hum += self.rng.uniform(-0.6, 0.6) + (self.humidity_threshold - self._hum) * 0.05

        if self.rng.random() < self.anomaly_probability:
            temp = self.temp_threshold + self.rng.choice([-1, 1]) * (
                self.temp_tolerance + self.rng.uniform(1.0, 4.0)
            )
            hum = self.humidity_threshold + self.rng.choice([-1, 1]) * (
                self.humidity_tolerance + self.rng.uniform(1.0, 5.0)
            )
        else:
            temp = _clamp(
                self._temp,
                self.temp_threshold - self.temp_tolerance,
                self.temp_threshold + self.temp_tolerance,
            )
            hum = _clamp(
                self._hum,
                self.humidity_threshold - self.humidity_tolerance,
                self.humidity_threshold + self.humidity_tolerance,
            )

        hum = _clamp(hum, 0.0, 100.0)
        return round(temp, 1), round(hum, 1)

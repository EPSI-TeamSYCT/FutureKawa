import random

from generator import ReadingGenerator


def _gen(anomaly=0.0, seed=42):
    return ReadingGenerator(
        temp_threshold=29.0,
        humidity_threshold=55.0,
        temp_tolerance=3.0,
        humidity_tolerance=2.0,
        anomaly_probability=anomaly,
        rng=random.Random(seed),
    )


def test_deterministic_with_seed():
    a = [_gen().next() for _ in range(5)]
    b = [_gen().next() for _ in range(5)]
    assert a == b


def test_normal_reading_within_tolerance():
    g = _gen(anomaly=0.0)
    for _ in range(100):
        t, h = g.next()
        assert 29.0 - 3.0 - 0.1 <= t <= 29.0 + 3.0 + 0.1
        assert 55.0 - 2.0 - 0.1 <= h <= 55.0 + 2.0 + 0.1


def test_anomaly_goes_out_of_range():
    g = _gen(anomaly=1.0)
    for _ in range(20):
        t, h = g.next()
        assert abs(t - 29.0) > 3.0 or abs(h - 55.0) > 2.0

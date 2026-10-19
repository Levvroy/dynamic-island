//! Notch window geometry, in logical pixels. Pure so it can be tested without a display.

pub const MIN_SIZE: f64 = 16.0;
pub const MAX_SIZE: f64 = 2000.0;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Rejects sizes the UI could never legitimately ask for, so a bad call
/// cannot shrink the notch to nothing or cover the whole screen.
pub fn validate_size(width: f64, height: f64) -> Result<(), String> {
    let ok = |v: f64| v.is_finite() && (MIN_SIZE..=MAX_SIZE).contains(&v);
    if ok(width) && ok(height) {
        Ok(())
    } else {
        Err(format!(
            "size {width}x{height} outside {MIN_SIZE}..={MAX_SIZE}"
        ))
    }
}

/// Places a window of `width`×`height` horizontally centered at the top edge of `monitor`.
pub fn top_center(monitor: Rect, width: f64, height: f64) -> Rect {
    Rect {
        x: monitor.x + (monitor.width - width) / 2.0,
        y: monitor.y,
        width,
        height,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const LAPTOP: Rect = Rect {
        x: 0.0,
        y: 0.0,
        width: 1536.0,
        height: 864.0,
    };

    // KF-007, KF-093
    #[test]
    fn centers_on_primary_monitor() {
        let r = top_center(LAPTOP, 200.0, 36.0);
        assert_eq!(r.x, 668.0);
        assert_eq!(r.y, 0.0);
    }

    // KF-091, KF-093
    #[test]
    fn centers_on_monitor_with_offset_origin() {
        let external = Rect {
            x: -1920.0,
            y: -200.0,
            width: 1920.0,
            height: 1080.0,
        };
        let r = top_center(external, 420.0, 300.0);
        assert_eq!(r.x, -1920.0 + 750.0);
        assert_eq!(r.y, -200.0);
    }

    // KNF-006
    #[test]
    fn rejects_degenerate_sizes() {
        assert!(validate_size(200.0, 36.0).is_ok());
        assert!(validate_size(0.0, 36.0).is_err());
        assert!(validate_size(200.0, f64::NAN).is_err());
        assert!(validate_size(5000.0, 36.0).is_err());
    }
}

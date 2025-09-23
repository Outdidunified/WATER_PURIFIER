import 'package:flutter/material.dart';
import 'dart:math' as math;

class WaterWavePainter extends CustomPainter {
  final double progress;
  final Color waveColor;
  final double animationValue;

  WaterWavePainter({
    required this.progress,
    required this.waveColor,
    required this.animationValue,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = waveColor
      ..style = PaintingStyle.fill;

    final path = Path();
    final double waterLevel = size.height * (1 - progress);
    final double waveHeight = 5.0;
    final double waveLength = size.width / 2;

    path.moveTo(0, waterLevel);
    for (double x = 0; x <= size.width; x++) {
      final double waveY = waterLevel +
          waveHeight *
              math.sin((x / waveLength) * 2 * math.pi + animationValue);
      path.lineTo(x, waveY);
    }
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

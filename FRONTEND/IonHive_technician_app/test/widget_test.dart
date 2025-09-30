import 'package:flutter_test/flutter_test.dart';
import 'package:ionhive_technician_app/main.dart';

void main() {
  testWidgets('App builds without errors', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const AquaPulseTechnicianApp());

    // Optional: check if the widget exists
    expect(find.byType(AquaPulseTechnicianApp), findsOneWidget);
  });
}

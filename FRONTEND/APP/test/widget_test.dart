import 'package:flutter_test/flutter_test.dart';

import 'package:aquapulse_app/main.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const aquapulse_app());
  });
}

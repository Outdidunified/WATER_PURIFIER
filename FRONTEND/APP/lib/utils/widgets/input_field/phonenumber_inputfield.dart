import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// Phone Number Input Widget
class PhoneNumberInput extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;
  final String? initialValue;

  const PhoneNumberInput({
    super.key,
    required this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.initialValue,
  });

  @override
  State<PhoneNumberInput> createState() => _PhoneNumberInputState();
}

class _PhoneNumberInputState extends State<PhoneNumberInput> {
  bool _hasError = false;
  bool _isValid = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void didUpdateWidget(covariant PhoneNumberInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialValue != oldWidget.initialValue) {
      final cleanNumber =
          widget.initialValue?.replaceAll('+91', '').trim() ?? '';
      _validateAndSet(cleanNumber);
    }
  }

  void _validateAndSet(String number) {
    final isValidIndianNumber =
        number.length == 10 && RegExp(r'^\d+$').hasMatch(number);
    setState(() {
      _hasError = number.isNotEmpty && !isValidIndianNumber;
      _isValid = number.length == 10 && isValidIndianNumber;
      widget.controller.text = number; // Update controller directly
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = _hasError
        ? theme.colorScheme.error
        : _isValid
            ? theme.colorScheme.primary
            : theme.dividerColor;

    return TextField(
      controller: widget.controller,
      focusNode: widget.focusNode,
      decoration: InputDecoration(
        labelText: 'Phone Number',
        labelStyle: theme.textTheme.bodyMedium,
        filled: true,
        fillColor: theme.colorScheme.surface,
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        errorText: _hasError ? "Enter a valid 10-digit phone number" : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor, width: 2.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor, width: 2.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: theme.primaryColor, width: 2.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: theme.colorScheme.error, width: 2.0),
        ),
        prefixIcon: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          margin: const EdgeInsets.only(right: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("🇮🇳", style: TextStyle(fontSize: 18)),
              const SizedBox(width: 4),
              Text("+91", style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
        counterText: "",
      ),
      style: theme.textTheme.bodyLarge,
      onChanged: (value) {
        final cleanValue = value.trim();
        final isValidIndianNumber =
            cleanValue.length <= 10 && RegExp(r'^\d*$').hasMatch(cleanValue);
        setState(() {
          _hasError = cleanValue.isNotEmpty && cleanValue.length != 10;
          _isValid = cleanValue.length == 10 && isValidIndianNumber;
          widget.controller.text = cleanValue; // Update controller directly
        });
        if (widget.onChanged != null) {
          widget.onChanged!(cleanValue); // Pass clean value without +91
        }
      },
      onSubmitted: widget.onSubmitted,
      keyboardType: TextInputType.phone,
      textInputAction: TextInputAction.next, // Show "Next" on keyboard
      maxLength: 10,
      buildCounter: (context,
              {required currentLength, required isFocused, maxLength}) =>
          null,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      // Aggressively disable autofill and interactive selection
      autofillHints: null,
      enableInteractiveSelection: false, // Disable copy/paste/autofill
    );
  }
}

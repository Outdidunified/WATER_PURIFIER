import 'dart:io';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Added for FilteringTextInputFormatter
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';

class TaskDetailPage extends StatefulWidget {
  final Task task;

  const TaskDetailPage({super.key, required this.task});

  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
  late String _selectedStatus;
  String _pendingReason = '';
  String _otp = '';
  File? _beforeImage;
  File? _afterImage;
  bool _isLoading = false;
  bool _accepted = false;
  bool _declined = false;
  String _declineReason = '';

  final TextEditingController _pendingReasonController =
      TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TechnicianController controller = Get.find<TechnicianController>();

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.task.taskStatus ?? 'Pending';
    if (widget.task.taskStatus == 'In Progress') {
      _accepted = true;
      _selectedStatus = 'Completed';
    } else if (widget.task.taskStatus == 'Pending' && widget.task.pendingReason != null) {
      _declined = true;
      _declineReason = widget.task.pendingReason!;
    }
  }

  @override
  void dispose() {
    _pendingReasonController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String type) async {
    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        if (type == 'before') {
          _beforeImage = File(pickedFile.path);
        } else {
          _afterImage = File(pickedFile.path);
        }
      });
    }
  }

Future<void> _acceptTask() async {
  // Show dialog to select estimated start and end times
  DateTime? estimatedStart;
  DateTime? estimatedEnd;

  await showDialog(
    context: context,
    builder: (context) {
      DateTime? start;
      DateTime? end;
      return StatefulBuilder(
        builder: (context, setState) {
          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            backgroundColor: Colors.white,
            child: Container(
              width: MediaQuery.of(context).size.width * 0.85,
              constraints: const BoxConstraints(maxHeight: 400),
              padding: const EdgeInsets.all(20),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Accept Task',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    // Start date time picker
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              start == null
                                  ? 'Select Start Date & Time'
                                  : DateFormat('MMM dd, yyyy - hh:mm a').format(start!),
                              style: const TextStyle(
                                  fontSize: 16, color: Colors.black87, fontWeight: FontWeight.w500),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.calendar_today, color: Colors.blue),
                            onPressed: () async {
                              DateTime? date;
                              await showDialog<DateTime>(
                                context: context,
                                builder: (context) => Dialog(
                                  backgroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16)),
                                  child: Container(
                                    width: 320,
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Text(
                                          'Select Date',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Container(
                                          height: 280,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade50,
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: Colors.grey.shade200),
                                          ),
                                          child: Theme(
                                            data: Theme.of(context).copyWith(
                                              colorScheme: Theme.of(context).colorScheme.copyWith(
                                                    primary: Colors.blue,
                                                    onPrimary: Colors.white,
                                                    surface: Colors.white,
                                                    onSurface: Colors.black87,
                                                    // Fix selected date visibility
                                                    secondary: Colors.blue.shade600,
                                                    onSecondary: Colors.white,
                                                    // These properties control the selected date appearance
                                                    tertiary: Colors.blue,
                                                    onTertiary: Colors.white,
                                                    surfaceVariant: Colors.blue.shade50,
                                                    onSurfaceVariant: Colors.blue.shade700,
                                                    // Today's date and selected date colors
                                                    primaryContainer: Colors.blue,
                                                    onPrimaryContainer: Colors.white,
                                                    outline: Colors.blue.shade300,
                                                  ),
                                              textButtonTheme: TextButtonThemeData(
                                                style: TextButton.styleFrom(
                                                  foregroundColor: Colors.blue,
                                                ),
                                              ),
                                            ),
                                            child: CalendarDatePicker(
                                              initialDate: DateTime.now(),
                                              firstDate: DateTime.now(),
                                              lastDate: DateTime.now()
                                                  .add(const Duration(days: 365)),
                                              onDateChanged: (selectedDate) {
                                                date = selectedDate;
                                              },
                                              currentDate: start ?? DateTime.now(),
                                              selectableDayPredicate: (day) => true,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            TextButton(
                                              onPressed: () => Navigator.of(context).pop(),
                                              style: TextButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 16, vertical: 8),
                                                minimumSize: Size.zero,
                                              ),
                                              child: const Text(
                                                'Cancel',
                                                style:
                                                    TextStyle(color: Colors.grey, fontSize: 14),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            ElevatedButton(
                                              onPressed: () => Navigator.of(context).pop(date),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.blue,
                                                foregroundColor: Colors.white,
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 12, vertical: 6),
                                                minimumSize: const Size(40, 28),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                              ),
                                              child: const Text(
                                                'OK',
                                                style: TextStyle(fontSize: 12),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );

                              if (date != null) {
                                TimeOfDay time = TimeOfDay.now();
                                await showDialog<TimeOfDay>(
                                  context: context,
                                  barrierColor: Colors.black54,
                                  builder: (context) => StatefulBuilder(
                                    builder: (context, setState) => Dialog(
                                      backgroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16)),
                                      elevation: 8,
                                      child: Container(
                                        width: 280,
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Text(
                                              'Select Time',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.black87,
                                              ),
                                            ),
                                            const SizedBox(height: 16),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 12, vertical: 12),
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [
                                                    Colors.blue.shade50,
                                                    Colors.indigo.shade50
                                                  ],
                                                  begin: Alignment.topLeft,
                                                  end: Alignment.bottomRight,
                                                ),
                                                borderRadius: BorderRadius.circular(12),
                                                border:
                                                    Border.all(color: Colors.blue.shade200),
                                              ),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.spaceEvenly,
                                                children: [
                                                  Column(
                                                    children: [
                                                      const Text(
                                                        'Hour',
                                                        style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey,
                                                            fontWeight: FontWeight.w400),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 8, vertical: 6),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(8),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: Colors.grey.shade300,
                                                              blurRadius: 2,
                                                              offset: const Offset(0, 1),
                                                            ),
                                                          ],
                                                        ),
                                                        child: DropdownButton<int>(
                                                          value: time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod,
                                                          underline: const SizedBox(),
                                                          isDense: true,
                                                          menuMaxHeight: 240,
                                                          dropdownColor: Colors.white,
                                                          items: List.generate(
                                                            12,
                                                            (i) => DropdownMenuItem(
                                                              value: i + 1,
                                                              child: Text(
                                                                (i + 1).toString().padLeft(2, '0'),
                                                                style: const TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                          ),
                                                          onChanged: (value) {
                                                            if (value != null) {
                                                              setState(() {
                                                                final newHour = time.period == DayPeriod.am 
                                                                    ? (value == 12 ? 0 : value)
                                                                    : (value == 12 ? 12 : value + 12);
                                                                time = TimeOfDay(
                                                                    hour: newHour,
                                                                    minute: time.minute);
                                                              });
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                 
                                                  Column(
                                                    children: [
                                                      const Text(
                                                        'Minute',
                                                        style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey,
                                                            fontWeight: FontWeight.w400),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 8, vertical: 6),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(8),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: Colors.grey.shade300,
                                                              blurRadius: 2,
                                                              offset: const Offset(0, 1),
                                                            ),
                                                          ],
                                                        ),
                                                        child: DropdownButton<int>(
                                                          value: time.minute,
                                                          underline: const SizedBox(),
                                                          isDense: true,
                                                          menuMaxHeight: 240,
                                                          dropdownColor: Colors.white,
                                                          items: List.generate(
                                                            60,
                                                            (i) => DropdownMenuItem(
                                                              value: i,
                                                              child: Text(
                                                                i.toString().padLeft(2, '0'),
                                                                style: const TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                          ),
                                                          onChanged: (value) {
                                                            if (value != null) {
                                                              setState(() {
                                                                time = TimeOfDay(
                                                                    hour: time.hour,
                                                                    minute: value);
                                                              });
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  Column(
                                                    children: [
                                                      const Text(
                                                        'Period',
                                                        style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey,
                                                            fontWeight: FontWeight.w400),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 8, vertical: 6),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(8),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: Colors.grey.shade300,
                                                              blurRadius: 2,
                                                              offset: const Offset(0, 1),
                                                            ),
                                                          ],
                                                        ),
                                                        child: DropdownButton<DayPeriod>(
                                                          value: time.period,
                                                          underline: const SizedBox(),
                                                          isDense: true,
                                                          dropdownColor: Colors.white,
                                                          items: const [
                                                            DropdownMenuItem(
                                                              value: DayPeriod.am,
                                                              child: Text(
                                                                'AM',
                                                                style: TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                            DropdownMenuItem(
                                                              value: DayPeriod.pm,
                                                              child: Text(
                                                                'PM',
                                                                style: TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                          ],
                                                          onChanged: (value) {
                                                            if (value != null) {
                                                              setState(() {
                                                                final currentHour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
                                                                final newHour = value == DayPeriod.am 
                                                                    ? (currentHour == 12 ? 0 : currentHour)
                                                                    : (currentHour == 12 ? 12 : currentHour + 12);
                                                                time = TimeOfDay(
                                                                    hour: newHour,
                                                                    minute: time.minute);
                                                              });
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(height: 20),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.end,
                                              children: [
                                                TextButton(
                                                  onPressed: () =>
                                                      Navigator.of(context).pop(),
                                                  child: const Text('Cancel'),
                                                ),
                                                const SizedBox(width: 8),
                                                ElevatedButton(
                                                  onPressed: () =>
                                                      Navigator.of(context).pop(time),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: Colors.blue,
                                                    foregroundColor: Colors.white,
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                            horizontal: 12,
                                                            vertical: 6),
                                                    minimumSize: const Size(40, 28),
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(6),
                                                    ),
                                                  ),
                                                  child: const Text(
                                                    'OK',
                                                    style: TextStyle(fontSize: 12),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                                if (time != null) {
                                  setState(() {
                                    start = DateTime(date!.year, date!.month, date!.day,
                                        time.hour, time.minute);
                                  });
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    // End date time picker (reuse same pattern)
                    Container(
  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12), // reduced padding
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              end == null
                                  ? 'Select End Date & Time'
                                  : DateFormat('MMM dd, yyyy - hh:mm a').format(end!),
                              style: const TextStyle(
                                  fontSize: 16, color: Colors.black87, fontWeight: FontWeight.w500),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.calendar_today, color: Colors.blue),
                            onPressed: () async {
                              DateTime? date;
                              await showDialog<DateTime>(
                                context: context,
                                builder: (context) => Dialog(
                                  backgroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16)),
                                  child: Container(
                                    width: 320,
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Text(
                                          'Select End Date',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Container(
                                          height: 280,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade50,
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: Colors.grey.shade200),
                                          ),
                                          child: Theme(
                                            data: Theme.of(context).copyWith(
                                              colorScheme: Theme.of(context).colorScheme.copyWith(
                                                    primary: Colors.blue,
                                                    onPrimary: Colors.white,
                                                    surface: Colors.white,
                                                    onSurface: Colors.black87,
                                                    // Fix selected date visibility
                                                    secondary: Colors.blue.shade600,
                                                    onSecondary: Colors.white,
                                                    // These properties control the selected date appearance
                                                    tertiary: Colors.blue,
                                                    onTertiary: Colors.white,
                                                    surfaceVariant: Colors.blue.shade50,
                                                    onSurfaceVariant: Colors.blue.shade700,
                                                    // Today's date and selected date colors
                                                    primaryContainer: Colors.blue,
                                                    onPrimaryContainer: Colors.white,
                                                    outline: Colors.blue.shade300,
                                                  ),
                                              textButtonTheme: TextButtonThemeData(
                                                style: TextButton.styleFrom(
                                                  foregroundColor: Colors.blue,
                                                ),
                                              ),
                                            ),
                                            child: CalendarDatePicker(
                                              initialDate: start ?? DateTime.now(),
                                              firstDate: DateTime.now(),
                                              lastDate: DateTime.now()
                                                  .add(const Duration(days: 365)),
                                              onDateChanged: (selectedDate) {
                                                date = selectedDate;
                                              },
                                              currentDate: end ?? DateTime.now(),
                                              selectableDayPredicate: (day) => true,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            TextButton(
                                              onPressed: () => Navigator.of(context).pop(),
                                              style: TextButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 16, vertical: 8),
                                                minimumSize: Size.zero,
                                              ),
                                              child: const Text(
                                                'Cancel',
                                                style:
                                                    TextStyle(color: Colors.grey, fontSize: 14),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            ElevatedButton(
                                              onPressed: () =>
                                                  Navigator.of(context).pop(date),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.blue,
                                                foregroundColor: Colors.white,
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 12, vertical: 6),
                                                minimumSize: const Size(40, 28),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                              ),
                                              child: const Text(
                                                'OK',
                                                style: TextStyle(fontSize: 12),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );

                              if (date != null) {
                                TimeOfDay time = TimeOfDay.now();
                                await showDialog<TimeOfDay>(
                                  context: context,
                                  barrierColor: Colors.black54,
                                  builder: (context) => StatefulBuilder(
                                    builder: (context, setState) => Dialog(
                                      backgroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16)),
                                      elevation: 8,
                                      child: Container(
                                        width: 280,
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Text(
                                              'Select End Time',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.black87,
                                              ),
                                            ),
                                            const SizedBox(height: 16),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 12, vertical: 12),
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [
                                                    Colors.blue.shade50,
                                                    Colors.indigo.shade50
                                                  ],
                                                  begin: Alignment.topLeft,
                                                  end: Alignment.bottomRight,
                                                ),
                                                borderRadius: BorderRadius.circular(12),
                                                border:
                                                    Border.all(color: Colors.blue.shade200),
                                              ),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.spaceEvenly,
                                                children: [
                                                  Column(
                                                    children: [
                                                      const Text(
                                                        'Hour',
                                                        style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey,
                                                            fontWeight: FontWeight.w400),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 8, vertical: 6),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(8),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: Colors.grey.shade300,
                                                              blurRadius: 2,
                                                              offset: const Offset(0, 1),
                                                            ),
                                                          ],
                                                        ),
                                                        child: DropdownButton<int>(
                                                          value: time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod,
                                                          underline: const SizedBox(),
                                                          isDense: true,
                                                          menuMaxHeight: 240,
                                                          dropdownColor: Colors.white,
                                                          items: List.generate(
                                                            12,
                                                            (i) => DropdownMenuItem(
                                                              value: i + 1,
                                                              child: Text(
                                                                (i + 1).toString().padLeft(2, '0'),
                                                                style: const TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                          ),
                                                          onChanged: (value) {
                                                            if (value != null) {
                                                              setState(() {
                                                                final newHour = time.period == DayPeriod.am 
                                                                    ? (value == 12 ? 0 : value)
                                                                    : (value == 12 ? 12 : value + 12);
                                                                time = TimeOfDay(
                                                                    hour: newHour,
                                                                    minute: time.minute);
                                                              });
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                
                                                  Column(
                                                    children: [
                                                      const Text(
                                                        'Minute',
                                                        style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey,
                                                            fontWeight: FontWeight.w400),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 8, vertical: 6),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(8),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: Colors.grey.shade300,
                                                              blurRadius: 2,
                                                              offset: const Offset(0, 1),
                                                            ),
                                                          ],
                                                        ),
                                                        child: DropdownButton<int>(
                                                          value: time.minute,
                                                          underline: const SizedBox(),
                                                          isDense: true,
                                                          menuMaxHeight: 240,
                                                          dropdownColor: Colors.white,
                                                          items: List.generate(
                                                            60,
                                                            (i) => DropdownMenuItem(
                                                              value: i,
                                                              child: Text(
                                                                i.toString().padLeft(2, '0'),
                                                                style: const TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                          ),
                                                          onChanged: (value) {
                                                            if (value != null) {
                                                              setState(() {
                                                                time = TimeOfDay(
                                                                    hour: time.hour,
                                                                    minute: value);
                                                              });
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  Column(
                                                    children: [
                                                      const Text(
                                                        'Period',
                                                        style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey,
                                                            fontWeight: FontWeight.w400),
                                                      ),
                                                      const SizedBox(height: 8),
                                                      Container(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 8, vertical: 6),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(8),
                                                          boxShadow: [
                                                            BoxShadow(
                                                              color: Colors.grey.shade300,
                                                              blurRadius: 2,
                                                              offset: const Offset(0, 1),
                                                            ),
                                                          ],
                                                        ),
                                                        child: DropdownButton<DayPeriod>(
                                                          value: time.period,
                                                          underline: const SizedBox(),
                                                          isDense: true,
                                                          dropdownColor: Colors.white,
                                                          items: const [
                                                            DropdownMenuItem(
                                                              value: DayPeriod.am,
                                                              child: Text(
                                                                'AM',
                                                                style: TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                            DropdownMenuItem(
                                                              value: DayPeriod.pm,
                                                              child: Text(
                                                                'PM',
                                                                style: TextStyle(
                                                                    fontSize: 12,
                                                                    fontWeight: FontWeight.w400,
                                                                    color: Colors.black87),
                                                              ),
                                                            ),
                                                          ],
                                                          onChanged: (value) {
                                                            if (value != null) {
                                                              setState(() {
                                                                final currentHour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
                                                                final newHour = value == DayPeriod.am 
                                                                    ? (currentHour == 12 ? 0 : currentHour)
                                                                    : (currentHour == 12 ? 12 : currentHour + 12);
                                                                time = TimeOfDay(
                                                                    hour: newHour,
                                                                    minute: time.minute);
                                                              });
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(height: 20),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.end,
                                              children: [
                                                TextButton(
                                                  onPressed: () =>
                                                      Navigator.of(context).pop(),
                                                  child: const Text('Cancel'),
                                                ),
                                                const SizedBox(width: 8),
                                                ElevatedButton(
                                                  onPressed: () =>
                                                      Navigator.of(context).pop(time),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: Colors.blue,
                                                    foregroundColor: Colors.white,
                                                    padding: const EdgeInsets.symmetric(
                                                        horizontal: 16, vertical: 8),
                                                    minimumSize: Size.zero,
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                  ),
                                                  child: const Text('OK'),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                                if (time != null) {
                                  setState(() {
                                    end = DateTime(date!.year, date!.month, date!.day,
                                        time.hour, time.minute);
                                  });
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Cancel'),
                        ),
                        const SizedBox(width: 10),
                        TextButton(
                          onPressed: () {
                            if (start == null || end == null) {
                              CustomSnackbar.showError(
                                  message: 'Please select both start and end times');
                              return;
                            }
                            if (end!.isBefore(start!)) {
                              CustomSnackbar.showError(
                                  message: 'End time must be after start time');
                              return;
                            }
                            estimatedStart = start;
                            estimatedEnd = end;
                            Navigator.of(context).pop();
                          },
                          child: const Text('Accept'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
    },
  );

  if (estimatedStart == null || estimatedEnd == null) return;

  if (widget.task.taskId == null) {
    CustomSnackbar.showError(message: 'Task ID is missing');
    return;
  }

  setState(() => _isLoading = true);
  try {
    await controller.acceptDeclineTask(
      taskId: widget.task.taskId!,
      action: 'accept',
      estimatedStart: estimatedStart,
      estimatedEnd: estimatedEnd,
    );
    setState(() {
      _accepted = true;
      _selectedStatus = 'Completed';
    });
  } catch (e) {
    CustomSnackbar.showError(message: 'Failed to accept task: $e');
  } finally {
    setState(() => _isLoading = false);
  }
}



  Future<void> _declineTask() async {
    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    // Show dialog for decline reason
    final reason = await showDialog<String>(
      context: context,
      builder: (context) {
        String declineReason = '';
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          backgroundColor: Colors.white,
          child: Container(
            width: MediaQuery.of(context).size.width * 0.85,
            constraints: const BoxConstraints(maxHeight: 300),
            padding: const EdgeInsets.all(20),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Decline Task',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: TextField(
                      onChanged: (value) => declineReason = value,
                      decoration: const InputDecoration(
                        labelText: 'Reason for declining',
                        hintText: 'Enter reason...',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.all(16),
                      ),
                      maxLines: 3,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(null),
                        child: const Text('Cancel'),
                      ),
                      const SizedBox(width: 10),
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(declineReason.trim()),
                        child: const Text('Decline'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (reason == null || reason.isEmpty) {
      return;
    }

    setState(() => _isLoading = true);
    try {
      await controller.acceptDeclineTask(
        taskId: widget.task.taskId!,
        action: 'decline',
        declineReason: reason,
      );
      setState(() {
        _declined = true;
        _declineReason = reason;
      });
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to decline task: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateTask() async {
    if (_selectedStatus == 'Pending' && _pendingReason.trim().isEmpty) {
      CustomSnackbar.showError(message: 'Pending reason is required');
      return;
    }
    if (_selectedStatus == 'Completed' && _otp.trim().isEmpty) {
      CustomSnackbar.showError(message: 'OTP is required to mark as completed');
      return;
    }

    // Validate images based on task type when completing task
    if (_selectedStatus == 'Completed') {
      if (widget.task.taskType == 2) {
        // Service task - require both before and after images
        if (_beforeImage == null) {
          CustomSnackbar.showError(message: 'Before Service Image is required to complete the task');
          return;
        }
        if (_afterImage == null) {
          CustomSnackbar.showError(message: 'After Service Image is required to complete the task');
          return;
        }
      } else {
        // Installation task - require only after installation image
        if (_afterImage == null) {
          CustomSnackbar.showError(message: 'After Installation Image is required to complete the task');
          return;
        }
      }
    }

    if (widget.task.taskId == null) {
      CustomSnackbar.showError(message: 'Task ID is missing');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await controller.updateTask(
        taskId: widget.task.taskId!,
        taskStatus: _selectedStatus,
        pendingReason: _selectedStatus == 'Pending' ? _pendingReason : null,
        otp: _selectedStatus == 'Completed' ? _otp : null,
        beforeImage: widget.task.taskType == 2 ? _beforeImage : null, // Only send before image for service tasks
        afterImage: _afterImage,
      );
    } catch (e) {
      CustomSnackbar.showError(message: 'Failed to update task: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildInfoItem(String title, String? value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey)),
          const SizedBox(height: 4),
          Text(value ?? 'N/A',
              style:
                  const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildDropdown() {
    List<String> statusOptions = _accepted ? ['Completed'] : ['Pending', 'In Progress', 'Completed'];
    return DropdownButtonFormField<String>(
      value: _selectedStatus,
      dropdownColor: Colors.white,
      decoration: InputDecoration(
        filled: true,
        fillColor: Colors.grey.shade100,
        labelText: 'Select Status',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
      items: statusOptions
          .map((status) => DropdownMenuItem(value: status, child: Text(status)))
          .toList(),
      onChanged: (val) => setState(() {
        if (val != null) _selectedStatus = val;
      }),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    required Function(String) onChanged,
    List<TextInputFormatter>? inputFormatters, // Added for OTP restrictions
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      maxLength: maxLength,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.grey.shade100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
      onChanged: onChanged,
    );
  }

  Widget _buildImageUploadRow({
    required String label,
    required File? file,
    required VoidCallback onPressed,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        Row(
          children: [
            OutlinedButton.icon(
              onPressed: onPressed,
              icon: const Icon(Icons.image),
              label: const Text('Pick Image'),
            ),
            const SizedBox(width: 16),
            if (file != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child:
                    Image.file(file, width: 90, height: 90, fit: BoxFit.cover),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSubmitButton(dynamic theme) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        icon: const Icon(Icons.check_circle_outline),
        label: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2))
            : const Text('Update Task'),
        style: FilledButton.styleFrom(
          backgroundColor: theme.primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: _isLoading ? null : _updateTask,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final task = widget.task;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: theme.primaryColor,
        title: const Text('Task Details'),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(task.taskDescription ?? "No description available",
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                _buildInfoItem(
                    'Assigned Date',
                    task.assignedDate != null
                        ? DateFormat('MMM dd, yyyy – hh:mm a')
                            .format(task.assignedDate!.toLocal())
                        : 'Not assigned'),
                _buildInfoItem("Customer's email", task.taskCreatedByUserEmail),
                if (task.wpDeviceId != null)
                  _buildInfoItem('WP Device ID', task.wpDeviceId),
                const SizedBox(height: 30),
                if (!_accepted && !_declined) ...[
                  Text('Accept or Decline Task',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          icon: const Icon(Icons.check),
                          label: const Text('Accept'),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _isLoading ? null : _acceptTask,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: FilledButton.icon(
                          icon: const Icon(Icons.close),
                          label: const Text('Decline'),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _isLoading ? null : _declineTask,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                ] else if (_accepted) ...[
                  Text('Update Task Status',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  _buildDropdown(),
                  if (_selectedStatus == 'Pending') ...[
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _pendingReasonController,
                      label: 'Pending Reason',
                      onChanged: (val) => _pendingReason = val,
                    ),
                  ],
                  if (_selectedStatus == 'Completed') ...[
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _otpController,
                      label: 'Enter OTP',
                      keyboardType: TextInputType.number,
                      onChanged: (val) => _otp = val,
                      inputFormatters: [
                        FilteringTextInputFormatter
                            .digitsOnly, // Allow only digits
                        LengthLimitingTextInputFormatter(
                            6), // Limit to 6 characters
                      ],
                      maxLength: 6, // Visual length limit with counter
                    ),
                  ],
                  const SizedBox(height: 24),
                  // Show different images based on task type
                  if (widget.task.taskType == 2) ...[
                    // Service task - show both before and after images
                    _buildImageUploadRow(
                      label: 'Before Service Image',
                      file: _beforeImage,
                      onPressed: () => _pickImage('before'),
                    ),
                    _buildImageUploadRow(
                      label: 'After Service Image',
                      file: _afterImage,
                      onPressed: () => _pickImage('after'),
                    ),
                  ] else ...[
                    // Installation task - show only after installation image
                    _buildImageUploadRow(
                      label: 'After Installation Image',
                      file: _afterImage,
                      onPressed: () => _pickImage('after'),
                    ),
                  ],
                  const SizedBox(height: 36),
                  _buildSubmitButton(theme),
                ] else if (_declined) ...[
                  Text('Task Declined',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'This task has been declined.',
                          style: TextStyle(color: Colors.red.shade800),
                        ),
                        if (_declineReason.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Reason: $_declineReason',
                            style: TextStyle(color: Colors.red.shade800),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

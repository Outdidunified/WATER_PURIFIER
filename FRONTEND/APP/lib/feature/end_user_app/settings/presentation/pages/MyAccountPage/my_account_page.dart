import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/button/custom_button.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:ionhive_water_purifier/utils/widgets/input_field/city_input_fields.dart';
import 'package:ionhive_water_purifier/utils/widgets/input_field/phonenumber_inputfield.dart';
import 'package:ionhive_water_purifier/utils/widgets/input_field/username_input_fields.dart';
import 'package:ionhive_water_purifier/utils/widgets/input_field/password_input_field.dart';
import 'package:ionhive_water_purifier/utils/widgets/loading/linear_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart'; // For formatting the date
import 'dart:convert'; // For JSON parsing

class EditAccountPage extends StatefulWidget {
  const EditAccountPage({super.key});

  @override
  State<EditAccountPage> createState() => _EditAccountPageState();
}

class _EditAccountPageState extends State<EditAccountPage> {
  late final FocusNode usernameFocusNode;
  late final FocusNode cityFocusNode;
  late final FocusNode phoneFocusNode;
  late final FocusNode address1FocusNode;
  late final FocusNode address2FocusNode;
  late final FocusNode districtFocusNode;
  late final FocusNode stateFocusNode;
  late final FocusNode countryFocusNode;
  late final FocusNode pincodeFocusNode;

  // State and District data
  Map<String, List<String>> stateDistrictData = {};
  String? selectedState;
  String? selectedDistrict;
  List<String> availableDistricts = [];

  @override
  void initState() {
    super.initState();
    usernameFocusNode = FocusNode();
    cityFocusNode = FocusNode();
    phoneFocusNode = FocusNode();
    address1FocusNode = FocusNode();
    address2FocusNode = FocusNode();
    districtFocusNode = FocusNode();
    stateFocusNode = FocusNode();
    countryFocusNode = FocusNode();
    pincodeFocusNode = FocusNode();
    
    // Load state-district data and then initialize form
    _loadStateDistrictData();
  }

  // Load state-district data from JSON file
  Future<void> _loadStateDistrictData() async {
    try {
      final String jsonString = await rootBundle.loadString('stateDistricts.json');
      final Map<String, dynamic> jsonData = json.decode(jsonString);
      
      setState(() {
        stateDistrictData = jsonData.map((key, value) => 
          MapEntry(key, List<String>.from(value))
        );
      });
      
      // After loading data, initialize form values
      _initializeFormValues();
    } catch (e) {
      debugPrint('Error loading state-district data: $e');
    }
  }

  // Initialize form values after data is loaded
  void _initializeFormValues() {
    final controller = Get.find<SettingsController>();
    if (controller.userData.value != null) {
      controller.initializeEditForm();
      controller.validateForm();
      
      // Set initial state and district from controller
      setState(() {
        final stateFromController = controller.editStateController.text.trim();
        final districtFromController = controller.editDistrictController.text.trim();
        
        // Only set selectedState if it exists in the dropdown items
        if (stateFromController.isNotEmpty && stateDistrictData.containsKey(stateFromController)) {
          selectedState = stateFromController;
          availableDistricts = stateDistrictData[selectedState!]!;
          
          // Only set selectedDistrict if it exists in the available districts
          if (districtFromController.isNotEmpty && availableDistricts.contains(districtFromController)) {
            selectedDistrict = districtFromController;
          } else {
            selectedDistrict = null;
          }
        } else {
          selectedState = null;
          selectedDistrict = null;
          availableDistricts = [];
        }
      });
    }
  }

  @override
  void dispose() {
    usernameFocusNode.dispose();
    cityFocusNode.dispose();
    phoneFocusNode.dispose();
    address1FocusNode.dispose();
    address2FocusNode.dispose();
    districtFocusNode.dispose();
    stateFocusNode.dispose();
    countryFocusNode.dispose();
    pincodeFocusNode.dispose();
    super.dispose();
  }

  // Consistent decoration similar to custom inputs
  InputDecoration _styledDecoration({
    required BuildContext context,
    required String label,
    required IconData icon,
  }) {
    final theme = Theme.of(context);
    return InputDecoration(
      labelText: label,
      labelStyle: theme.textTheme.bodyMedium,
      filled: true,
      fillColor: theme.colorScheme.surface,
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: theme.dividerColor, width: 2.0),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: theme.dividerColor, width: 2.0),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: theme.primaryColor, width: 2.0),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: theme.colorScheme.error, width: 2.0),
      ),
      prefixIcon: Icon(icon, color: Colors.blueAccent),
    );
  }

  @override
  Widget build(BuildContext context) {
    final SettingsController controller = Get.find<SettingsController>();
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Account',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
            color: Colors.white,
            letterSpacing: 1.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Get.back(),
        ),
      ),
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(() {
        if (controller.isLoading.value) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: LinearLoadingIndicator(
                color: theme.colorScheme.primary,
                height: 4.0,
                widthFactor: 0.3,
              ),
            ),
          );
        } else if (controller.errorMessage.value.isNotEmpty) {
          return ErrorDisplayWidget(
            errorMessage: controller.errorMessage.value,
            onRetry: () {
              controller.fetchUserDetails();
            },
          );
        }
        if (controller.userData.value == null) {
          return Center(
            child: Text(
              'No user data available',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
                fontSize: screenWidth * 0.04,
              ),
            ),
          );
        }

        return SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom, // Adjust for keyboard
          ),
          child: Column(
            children: [
             Stack(
  children: [
    Container(
      height: 140,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
    ),
    Positioned.fill(
      child: Align(
        alignment: Alignment.center,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: 40,
                backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                child: const Icon(
                  Icons.person,
                  size: 55,
                  color: Colors.white,
                ),
              ),
            ),
            SizedBox(height: screenHeight * 0.008),
            Text(
              (controller.userData.value?.data.name ?? '').isEmpty
                  ? 'Complete your profile'
                  : controller.userData.value!.data.name!,
              style: TextStyle(
                color: Colors.white,
                fontSize: screenWidth * 0.04,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    ),
  ],
),

              SizedBox(height: screenHeight * 0.02),
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.02,
                ),
                child: AnimatedOpacity(
                  opacity: 1.0,
                  duration: const Duration(milliseconds: 500),
                  child: Form(
                    key: controller.formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Edit Your Profile',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: screenWidth * 0.05,
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Username
                        UsernameInput(
                          controller: controller.editNameController,
                          focusNode: usernameFocusNode,
                          onChanged: (value) => controller.validateForm(),
                          onSubmitted: (_) {
                            FocusScope.of(context).requestFocus(phoneFocusNode);
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Phone
                        PhoneNumberInput(
                          controller: controller.editPhoneController,
                          focusNode: phoneFocusNode,
                          onChanged: (phone) {
                            final phoneNumber = phone.replaceAll('+91', '').trim();
                            controller.editPhoneController.text = phoneNumber;
                            controller.validateForm();
                          },
                          onSubmitted: (_) {
                            FocusScope.of(context).requestFocus(address1FocusNode);
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Email (disabled, same design)
                        TextField(
                          decoration: _styledDecoration(
                            context: context,
                            label: 'Email',
                            icon: Icons.email_outlined,
                          ),
                          controller: TextEditingController(
                            text: controller.userData.value?.data.email ?? 'N/A',
                          ),
                          enabled: false,
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Address Line 1
                        TextField(
                          controller: controller.editAddressLine1Controller,
                          focusNode: address1FocusNode,
                          decoration: _styledDecoration(
                            context: context,
                            label: 'Address Line 1',
                            icon: Icons.home_outlined,
                          ),
                          textInputAction: TextInputAction.next,
                          onChanged: (_) => controller.validateForm(),
                          onSubmitted: (_) =>
                              FocusScope.of(context).requestFocus(address2FocusNode),
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Address Line 2
                        TextField(
                          controller: controller.editAddressLine2Controller,
                          focusNode: address2FocusNode,
                          decoration: _styledDecoration(
                            context: context,
                            label: 'Address Line 2',
                            icon: Icons.home_work_outlined,
                          ),
                          textInputAction: TextInputAction.next,
                          onChanged: (_) => controller.validateForm(),
                          onSubmitted: (_) =>
                              FocusScope.of(context).requestFocus(cityFocusNode),
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // City
                        CityInput(
                          controller: controller.editCityController,
                          focusNode: cityFocusNode,
                          onChanged: (value) => controller.validateForm(),
                          onSubmitted: (_) {
                            FocusScope.of(context).requestFocus(countryFocusNode);
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Country
                        TextField(
                          controller: controller.editCountryController,
                          focusNode: countryFocusNode,
                          decoration: _styledDecoration(
                            context: context,
                            label: 'Country',
                            icon: Icons.public_outlined,
                          ),
                          textInputAction: TextInputAction.next,
                          onChanged: (_) => controller.validateForm(),
                          onSubmitted: (_) =>
                              FocusScope.of(context).requestFocus(stateFocusNode),
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // State Dropdown
                        DropdownButtonFormField<String>(
                          value: selectedState,
                          focusNode: stateFocusNode,
                          decoration: _styledDecoration(
                            context: context,
                            label: 'State',
                            icon: Icons.flag_outlined,
                          ),
                          hint: Text(stateDistrictData.isEmpty ? 'Loading...' : 'Select State'),
                          isExpanded: true,
                          dropdownColor: Colors.white,
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: 16,
                          ),
                          items: stateDistrictData.isEmpty
                              ? []
                              : stateDistrictData.keys.map((String state) {
                                  return DropdownMenuItem<String>(
                                    value: state,
                                    child: Text(state),
                                  );
                                }).toList(),
                          onChanged: stateDistrictData.isEmpty ? null : (String? newValue) {
                            setState(() {
                              selectedState = newValue;
                              selectedDistrict = null; // Reset district when state changes
                              availableDistricts = newValue != null 
                                  ? stateDistrictData[newValue]! 
                                  : [];
                              
                              // Update controller
                              controller.editStateController.text = newValue ?? '';
                              controller.editDistrictController.text = '';
                              controller.validateForm();
                            });
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // District Dropdown
                        DropdownButtonFormField<String>(
                          value: selectedDistrict,
                          focusNode: districtFocusNode,
                          decoration: _styledDecoration(
                            context: context,
                            label: 'District',
                            icon: Icons.map_outlined,
                          ),
                          hint: Text(selectedState == null ? 'Select State First' : 'Select District'),
                          isExpanded: true,
                          dropdownColor: Colors.white,
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: 16,
                          ),
                          items: availableDistricts.isEmpty 
                              ? []
                              : availableDistricts.map((String district) {
                                  return DropdownMenuItem<String>(
                                    value: district,
                                    child: Text(district),
                                  );
                                }).toList(),
                          onChanged: selectedState == null || availableDistricts.isEmpty ? null : (String? newValue) {
                            setState(() {
                              selectedDistrict = newValue;
                              
                              // Update controller
                              controller.editDistrictController.text = newValue ?? '';
                              controller.validateForm();
                            });
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Pincode
                        TextField(
                          controller: controller.editPincodeController,
                          focusNode: pincodeFocusNode,
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.done,
                          decoration: _styledDecoration(
                            context: context,
                            label: 'Pincode',
                            icon: Icons.pin_drop_outlined,
                          ),
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          maxLength: 6,
                          buildCounter: (context,
                                  {required currentLength,
                                  required isFocused,
                                  required maxLength}) =>
                              null,
                          onChanged: (_) => controller.validateForm(),
                        ),
                        SizedBox(height: screenHeight * 0.02),

                        // Password
                        Obx(() => Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            PasswordInput(
                              controller: controller.editPasswordController,
                              hintText: 'Enter 4-digit PIN',
                              errorText: controller.passwordError.value.isEmpty
                                  ? null
                                  : controller.passwordError.value,
                              onChanged: (_) => controller.validateForm(),
                            ),
                          ],
                        )),
                        SizedBox(height: screenHeight * 0.04),

                        // Save Button
                        Center(
                          child: Obx(() {
                            return CustomButton(
                              text: "Save Changes",
                              isLoading: controller.isEditLoading.value,
                              onPressed: controller.isFormValid.value &&
                                      !controller.isEditLoading.value
                                  ? () async {
                                      final userData = controller.userData.value!.data;
                                      await controller.updateUserDetails(
                                        userId: userData.userId,
                                        email: userData.email,
                                        name: controller.editNameController.text.trim(),
                                        phone: controller.editPhoneController.text.trim(),
                                        city: controller.editCityController.text.trim(),
                                        addressline1: controller
                                            .editAddressLine1Controller.text
                                            .trim(),
                                        addressline2: controller
                                            .editAddressLine2Controller.text
                                            .trim(),
                                        district: controller.editDistrictController.text
                                            .trim(),
                                        state: controller.editStateController.text.trim(),
                                        country:
                                            controller.editCountryController.text.trim(),
                                        pincode:
                                            controller.editPincodeController.text.trim(),
                                        password: controller.editPasswordController.text.trim(),
                                      );
                                    }
                                  : () {},
                              borderRadius: 12.0,
                              padding: EdgeInsets.symmetric(
                                horizontal: screenWidth * 0.1,
                                vertical: screenWidth * 0.04,
                              ),
                              gradient: LinearGradient(
                                colors: controller.isFormValid.value &&
                                        !controller.isEditLoading.value
                                    ? [
                                        theme.colorScheme.primary,
                                        theme.colorScheme.primary.withOpacity(0.8),
                                      ]
                                    : [
                                        Colors.grey.shade400,
                                        Colors.grey.shade500,
                                      ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              textStyle: TextStyle(
                                fontSize: screenWidth * 0.04,
                                fontWeight: FontWeight.w600,
                              ),
                              boxShadow: BoxShadow(
                                color: theme.primaryColor.withOpacity(0.5),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            );
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

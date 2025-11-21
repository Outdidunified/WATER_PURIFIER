import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_technician_app/utils/widgets/button/custom_button.dart';
import 'package:ionhive_technician_app/utils/widgets/error/error_display_widget.dart';
import 'package:ionhive_technician_app/utils/widgets/loading/linear_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
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
  late final FocusNode passwordFocusNode;

  // State and District data
  Map<String, List<String>> stateDistrictData = {};
  String? selectedState;
  String? selectedDistrict;
  List<String> availableDistricts = [];
  
  bool _isPasswordVisible = false;

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
    passwordFocusNode = FocusNode();
    
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
    final controller = Get.find<TechnicianSettingsController>();
    if (controller.technicianData.value != null) {
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

  InputDecoration _styledDecoration({
    required BuildContext context,
    required String label,
    required IconData icon,
    bool hasError = false,
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
        borderSide: BorderSide(color: hasError ? theme.colorScheme.error : theme.dividerColor, width: 2.0),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: theme.primaryColor, width: 2.0),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: theme.colorScheme.error, width: 2.0),
      ),
      prefixIcon: Icon(icon, color: theme.colorScheme.onSurface.withOpacity(0.6)),
    );

  }

  @override
  Widget build(BuildContext context) {
    final TechnicianSettingsController controller =
    Get.find<TechnicianSettingsController>();
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
              controller.fetchTechnicianDetails();
            },
          );
        }
        if (controller.technicianData.value == null) {
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
            bottom: MediaQuery.of(context).viewInsets.bottom,
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
                              backgroundColor:
                              theme.colorScheme.primary.withOpacity(0.1),
                              child: const Icon(
                                Icons.person,
                                size: 55,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.008),
                          Text(
                            (controller.technicianData.value?.name ?? '')
                                .isEmpty
                                ? 'Complete your profile'
                                : controller.technicianData.value!.name!,
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

                        // Name
                        Obx(() => Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextField(
                              controller: controller.editNameController,
                              focusNode: usernameFocusNode,
                              decoration: _styledDecoration(
                                  context: context,
                                  label: 'Name',
                                  icon: Icons.person_outline,
                                  hasError: controller.nameError.value.isNotEmpty),
                              onChanged: (_) => controller.validateForm(),
                              textInputAction: TextInputAction.next,
                              onSubmitted: (_) {
                                FocusScope.of(context).requestFocus(phoneFocusNode);
                              },
                            ),
                            if (controller.nameError.value.isNotEmpty)
                              Padding(
                                padding: EdgeInsets.only(top: screenHeight * 0.008),
                                child: Text(
                                  controller.nameError.value,
                                  style: TextStyle(
                                    color: Colors.red,
                                    fontSize: screenWidth * 0.03,
                                  ),
                                ),
                              ),
                          ],
                        )),
                        SizedBox(height: screenHeight * 0.02),

                        // Phone
                        Obx(() => Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextField(
                              controller: controller.editPhoneController,
                              focusNode: phoneFocusNode,
                              decoration: _styledDecoration(
                                  context: context,
                                  label: 'Phone',
                                  icon: Icons.phone_outlined,
                                  hasError: controller.phoneError.value.isNotEmpty),
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly
                              ],
                              maxLength: 10,
                              buildCounter: (context,
                                  {required int currentLength,
                                    required bool isFocused,
                                    required int? maxLength}) =>
                              null,
                              onChanged: (_) => controller.validateForm(),
                              textInputAction: TextInputAction.next,
                              onSubmitted: (_) {
                                FocusScope.of(context).requestFocus(cityFocusNode);
                              },
                            ),
                            if (controller.phoneError.value.isNotEmpty)
                              Padding(
                                padding: EdgeInsets.only(top: screenHeight * 0.008),
                                child: Text(
                                  controller.phoneError.value,
                                  style: TextStyle(
                                    color: Colors.red,
                                    fontSize: screenWidth * 0.03,
                                  ),
                                ),
                              ),
                          ],
                        )),

                        SizedBox(height: screenHeight * 0.02),

                        // Email (disabled)
                        TextField(
                          decoration: _styledDecoration(
                              context: context,
                              label: 'Email',
                              icon: Icons.email_outlined),
                          controller: TextEditingController(
                              text: controller.technicianData.value?.email ??
                                  'N/A'),
                          enabled: false,
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),

                        // Rest of fields (Address, District, State, Country, Pincode)
                        SizedBox(height: screenHeight * 0.02),
                        ..._buildAddressFields(theme, screenWidth, screenHeight, controller),
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

  List<Widget> _buildAddressFields(ThemeData theme, double screenWidth,
      double screenHeight, TechnicianSettingsController controller) {
    return [
      // City
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller.editCityController,
            focusNode: cityFocusNode,
            decoration: _styledDecoration(
                context: context,
                label: 'City',
                icon: Icons.location_city_outlined,
                hasError: controller.cityError.value.isNotEmpty),
            onChanged: (_) => controller.validateForm(),
            textInputAction: TextInputAction.next,
            onSubmitted: (_) {
              FocusScope.of(context).requestFocus(countryFocusNode);
            },
          ),
          if (controller.cityError.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.008),
              child: Text(
                controller.cityError.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.02),
      // Country
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller.editCountryController,
            focusNode: countryFocusNode,
            decoration: _styledDecoration(
                context: context, 
                label: 'Country', 
                icon: Icons.public_outlined,
                hasError: controller.countryError.value.isNotEmpty),
            textInputAction: TextInputAction.next,
            onChanged: (_) => controller.validateForm(),
            onSubmitted: (_) =>
                FocusScope.of(context).requestFocus(stateFocusNode),
          ),
          if (controller.countryError.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.008),
              child: Text(
                controller.countryError.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.02),
      // State Dropdown
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<String>(
            value: selectedState,
            focusNode: stateFocusNode,
            decoration: _styledDecoration(
                context: context, 
                label: 'State', 
                icon: Icons.flag_outlined,
                hasError: controller.stateError.value.isNotEmpty),
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
                selectedDistrict = null;
                availableDistricts = newValue != null 
                    ? stateDistrictData[newValue]! 
                    : [];
                
                controller.editStateController.text = newValue ?? '';
                controller.editDistrictController.text = '';
                controller.validateForm();
              });
            },
          ),
          if (controller.stateError.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.008),
              child: Text(
                controller.stateError.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.02),
      // District Dropdown
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<String>(
            value: selectedDistrict,
            focusNode: districtFocusNode,
            decoration: _styledDecoration(
                context: context, 
                label: 'District', 
                icon: Icons.map_outlined,
                hasError: controller.districtError.value.isNotEmpty),
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
                
                controller.editDistrictController.text = newValue ?? '';
                controller.validateForm();
              });
            },
          ),
          if (controller.districtError.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.008),
              child: Text(
                controller.districtError.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.02),
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller.editAddress1Controller,
            focusNode: address1FocusNode,
            decoration: _styledDecoration(
                context: context, 
                label: 'Address Line 1', 
                icon: Icons.home_outlined,
                hasError: controller.address1Error.value.isNotEmpty),
            textInputAction: TextInputAction.next,
            onChanged: (_) => controller.validateForm(),
            onSubmitted: (_) =>
                FocusScope.of(context).requestFocus(address2FocusNode),
          ),
          if (controller.address1Error.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.008),
              child: Text(
                controller.address1Error.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.02),
      TextField(
        controller: controller.editAddress2Controller,
        focusNode: address2FocusNode,
        decoration: _styledDecoration(
            context: context, 
            label: 'Address Line 2', 
            icon: Icons.home_work_outlined),
        textInputAction: TextInputAction.next,
        onChanged: (_) => controller.validateForm(),
        onSubmitted: (_) =>
            FocusScope.of(context).requestFocus(pincodeFocusNode),
      ),
      SizedBox(height: screenHeight * 0.02),
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller.editPincodeController,
            focusNode: pincodeFocusNode,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            decoration: _styledDecoration(
                context: context, 
                label: 'Pincode', 
                icon: Icons.pin_drop_outlined,
                hasError: controller.pincodeError.value.isNotEmpty),
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            maxLength: 6,
            buildCounter: (context, {required currentLength, required isFocused, required maxLength}) => null,
            onChanged: (_) => controller.validateForm(),
            onSubmitted: (_) => FocusScope.of(context).requestFocus(passwordFocusNode),
          ),
          if (controller.pincodeError.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.008),
              child: Text(
                controller.pincodeError.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.02),
      Obx(() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller.editPasswordController,
            focusNode: passwordFocusNode,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            decoration: InputDecoration(
              labelText: 'Enter 4-digit PIN',
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
              prefixIcon: Icon(Icons.lock_outlined, color: theme.colorScheme.onSurface.withOpacity(0.6)),
              suffixIcon: IconButton(
                icon: Icon(
                  _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
                onPressed: () {
                  setState(() {
                    _isPasswordVisible = !_isPasswordVisible;
                  });
                },
              ),
            ),
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            maxLength: 4,
            buildCounter: (context, {required currentLength, required isFocused, required maxLength}) => null,
            obscureText: !_isPasswordVisible,
            onChanged: (_) => controller.validateForm(),
          ),
          if (controller.passwordError.value.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: screenHeight * 0.01),
              child: Text(
                controller.passwordError.value,
                style: TextStyle(
                  color: Colors.red,
                  fontSize: screenWidth * 0.03,
                ),
              ),
            ),
        ],
      )),
      SizedBox(height: screenHeight * 0.04),
      Center(
        child: Obx(() {
          return CustomButton(
            text: "Save Changes",
            isLoading: controller.isEditLoading.value,
            onPressed: controller.isFormValid.value && !controller.isEditLoading.value
                ? controller.saveChanges
                : () {},
            borderRadius: 12.0,
            padding: EdgeInsets.symmetric(
              horizontal: screenWidth * 0.1,
              vertical: screenWidth * 0.04,
            ),
            gradient: LinearGradient(
              colors: controller.isFormValid.value && !controller.isEditLoading.value
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
    ];
  }
}

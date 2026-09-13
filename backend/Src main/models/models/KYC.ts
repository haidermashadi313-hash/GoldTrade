// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 1/10
// IMPORTS + ENUMS + INTERFACES
// ======================================================

import mongoose, { Schema, Document, Model } from "mongoose";

// ======================================================
// KYC STATUS ENUM
// ======================================================

export enum KYCStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  RESUBMISSION_REQUIRED = "RESUBMISSION_REQUIRED",
}

// ======================================================
// VERIFICATION LEVEL ENUM
// ======================================================

export enum VerificationLevel {
  LEVEL_0 = "LEVEL_0", // No verification
  LEVEL_1 = "LEVEL_1", // CNIC only
  LEVEL_2 = "LEVEL_2", // CNIC + Selfie
  LEVEL_3 = "LEVEL_3", // Full KYC + Address
  LEVEL_4 = "LEVEL_4", // Enhanced Due Diligence
}

// ======================================================
// DOCUMENT TYPE ENUM
// ======================================================

export enum DocumentType {
  CNIC = "CNIC",
  PASSPORT = "PASSPORT",
  DRIVER_LICENSE = "DRIVER_LICENSE",
  NICOP = "NICOP",
}

// ======================================================
// DOCUMENT STATUS ENUM
// ======================================================

export enum DocumentStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

// ======================================================
// ADDRESS DOCUMENT ENUM
// ======================================================

export enum AddressDocumentType {
  UTILITY_BILL = "UTILITY_BILL",
  BANK_STATEMENT = "BANK_STATEMENT",
  RENT_AGREEMENT = "RENT_AGREEMENT",
  INTERNET_BILL = "INTERNET_BILL",
}

// ======================================================
// REVIEW DECISION ENUM
// ======================================================

export enum ReviewDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  REQUEST_RESUBMISSION = "REQUEST_RESUBMISSION",
}

// ======================================================
// IDENTITY DOCUMENT INTERFACE
// ======================================================

export interface IIdentityDocument {
  type: DocumentType;

  frontImage: string;

  backImage?: string;

  documentNumber: string;

  issueDate?: Date;

  expiryDate?: Date;

  status: DocumentStatus;

  uploadedAt: Date;
}

// ======================================================
// OCR DATA INTERFACE
// ======================================================

export interface IOCRData {
  fullName?: string;

  fatherName?: string;

  documentNumber?: string;

  dateOfBirth?: Date;

  gender?: string;

  address?: string;

  nationality?: string;

  confidenceScore: number;
}

// ======================================================
// SELFIE VERIFICATION INTERFACE
// ======================================================

export interface ISelfieVerification {
  selfieImage: string;

  faceMatchScore: number;

  livenessScore: number;

  verified: boolean;

  verifiedAt?: Date;
}

// ======================================================
// ADDRESS VERIFICATION INTERFACE
// ======================================================

export interface IAddressVerification {
  documentType: AddressDocumentType;

  documentImage: string;

  address: string;

  city: string;

  province: string;

  postalCode?: string;

  verified: boolean;
}

// ======================================================
// ADMIN REVIEW INTERFACE
// ======================================================

export interface IAdminReview {
  reviewedBy?: mongoose.Types.ObjectId;

  reviewedAt?: Date;

  decision?: ReviewDecision;

  rejectionReason?: string;

  notes?: string;
}

// ======================================================
// AML / COMPLIANCE INTERFACE
// ======================================================

export interface IAMLCompliance {
  pepMatch: boolean;

  sanctionsMatch: boolean;

  amlRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  complianceScore: number;

  manualReviewRequired: boolean;
}

// ======================================================
// MAIN KYC DOCUMENT INTERFACE
// ======================================================

export interface IKYC extends Document {
  user: mongoose.Types.ObjectId;

  applicationId: string;

  status: KYCStatus;

  verificationLevel: VerificationLevel;

  identityDocument: IIdentityDocument;

  ocrData: IOCRData;

  selfieVerification: ISelfieVerification;

  addressVerification: IAddressVerification;

  adminReview: IAdminReview;

  amlCompliance: IAMLCompliance;

  approveKYC(adminId: mongoose.Types.ObjectId): Promise<IKYC>;

  rejectKYC(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IKYC>;
}

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: BASIC KYC SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 2/10
// BASIC KYC SCHEMA
// ======================================================

const KYCSchema = new Schema<any>(
  {
    // ==================================================
    // USER REFERENCE
    // ==================================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ==================================================
    // KYC STATUS
    // ==================================================

    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.NOT_SUBMITTED,
      index: true,
    },

    verificationLevel: {
      type: String,
      enum: Object.values(VerificationLevel),
      default: VerificationLevel.LEVEL_0,
      index: true,
    },

    // ==================================================
    // SUBMISSION INFORMATION
    // ==================================================

    applicationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    submittedAt: {
      type: Date,
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },

    // ==================================================
    // COMPLETION PROGRESS
    // ==================================================

    completion: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      cnicUploaded: {
        type: Boolean,
        default: false,
      },

      selfieUploaded: {
        type: Boolean,
        default: false,
      },

      addressUploaded: {
        type: Boolean,
        default: false,
      },

      ocrCompleted: {
        type: Boolean,
        default: false,
      },

      faceMatched: {
        type: Boolean,
        default: false,
      },

      amlCompleted: {
        type: Boolean,
        default: false,
      },
    },

    // ==================================================
    // RESUBMISSION TRACKING
    // ==================================================

    resubmission: {
      required: {
        type: Boolean,
        default: false,
      },

      attempts: {
        type: Number,
        default: 0,
      },

      maxAttempts: {
        type: Number,
        default: 5,
      },

      requestedAt: {
        type: Date,
      },

      reason: {
        type: String,
        default: "",
      },

      deadline: {
        type: Date,
      },
    },

    // ==================================================
    // KYC RISK PROFILE
    // ==================================================

    riskProfile: {
      riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      riskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
      },

      enhancedDueDiligence: {
        type: Boolean,
        default: false,
      },

      manualReviewRequired: {
        type: Boolean,
        default: false,
      },
    },

    // ==================================================
    // COUNTRY & NATIONALITY
    // ==================================================

    nationality: {
      type: String,
      default: "Pakistan",
      trim: true,
    },

    countryOfResidence: {
      type: String,
      default: "Pakistan",
      trim: true,
    },

    residentStatus: {
      type: String,
      enum: [
        "PAKISTANI_RESIDENT",
        "OVERSEAS_PAKISTANI",
        "FOREIGN_NATIONAL",
      ],
      default: "PAKISTANI_RESIDENT",
    },

    // ==================================================
    // CONSENT & DECLARATIONS
    // ==================================================

    consent: {
      termsAccepted: {
        type: Boolean,
        default: false,
      },

      privacyAccepted: {
        type: Boolean,
        default: false,
      },

      amlDeclarationAccepted: {
        type: Boolean,
        default: false,
      },

      acceptedAt: {
        type: Date,
      },

      ipAddress: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // METADATA
    // ==================================================

    metadata: {
      source: {
        type: String,
        enum: ["MOBILE_APP", "WEB_APP", "ADMIN_PANEL"],
        default: "MOBILE_APP",
      },

      appVersion: {
        type: String,
        default: "1.0.0",
      },

      apiVersion: {
        type: String,
        default: "V17",
      },
    },

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: CNIC & PASSPORT DOCUMENT SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 3/10
// CNIC + PASSPORT + DOCUMENT VERIFICATION SCHEMA
// ======================================================

    // ==================================================
    // PRIMARY IDENTITY DOCUMENT
    // ==================================================

    identityDocument: {
      type: {
        type: String,
        enum: Object.values(DocumentType),
        default: DocumentType.CNIC,
      },

      status: {
        type: String,
        enum: Object.values(DocumentStatus),
        default: DocumentStatus.PENDING,
      },

      documentNumber: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
        index: true,
      },

      issueDate: Date,

      expiryDate: Date,

      uploadedAt: {
        type: Date,
        default: Date.now,
      },

      verifiedAt: Date,

      // ===============================
      // DOCUMENT IMAGES
      // ===============================

      frontImage: {
        type: String,
        required: true,
      },

      backImage: {
        type: String,
        default: "",
      },

      originalFrontImage: {
        type: String,
        default: "",
      },

      originalBackImage: {
        type: String,
        default: "",
      },

      thumbnailFront: {
        type: String,
        default: "",
      },

      thumbnailBack: {
        type: String,
        default: "",
      },

      // ===============================
      // IMAGE QUALITY ANALYSIS
      // ===============================

      imageQuality: {
        frontScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },

        backScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },

        resolutionWidth: Number,
        resolutionHeight: Number,

        brightnessScore: {
          type: Number,
          default: 0,
        },

        blurScore: {
          type: Number,
          default: 0,
        },

        glareDetected: {
          type: Boolean,
          default: false,
        },

        croppedDetected: {
          type: Boolean,
          default: false,
        },

        edgesDetected: {
          type: Boolean,
          default: false,
        },
      },

      // ===============================
      // OCR PROCESSING STATUS
      // ===============================

      ocrProcessing: {
        completed: {
          type: Boolean,
          default: false,
        },

        processingTimeMs: {
          type: Number,
          default: 0,
        },

        confidenceScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },

        languageDetected: {
          type: String,
          default: "URDU_ENGLISH",
        },

        extractedSuccessfully: {
          type: Boolean,
          default: false,
        },

        lastProcessedAt: Date,
      },

      // ===============================
      // DOCUMENT AUTHENTICITY
      // ===============================

      authenticity: {
        tamperingDetected: {
          type: Boolean,
          default: false,
        },

        editedImageDetected: {
          type: Boolean,
          default: false,
        },

        duplicateDocumentDetected: {
          type: Boolean,
          default: false,
        },

        watermarkDetected: {
          type: Boolean,
          default: false,
        },

        hologramDetected: {
          type: Boolean,
          default: false,
        },

        barcodeDetected: {
          type: Boolean,
          default: false,
        },

        qrCodeDetected: {
          type: Boolean,
          default: false,
        },

        authenticityScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    },

    // ==================================================
    // PASSPORT VERIFICATION
    // ==================================================

    passportVerification: {
      passportNumber: {
        type: String,
        default: "",
        uppercase: true,
      },

      nationality: {
        type: String,
        default: "",
      },

      issuingCountry: {
        type: String,
        default: "",
      },

      issueDate: Date,
      expiryDate: Date,

      passportImage: {
        type: String,
        default: "",
      },

      mrzDetected: {
        type: Boolean,
        default: false,
      },

      mrzCode: {
        type: String,
        default: "",
      },

      mrzConfidence: {
        type: Number,
        default: 0,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: Date,
    },

    // ==================================================
    // ADDITIONAL DOCUMENTS
    // ==================================================

    additionalDocuments: [
      {
        documentType: {
          type: String,
          enum: Object.values(DocumentType),
        },

        image: String,

        documentNumber: String,

        uploadedAt: {
          type: Date,
          default: Date.now,
        },

        status: {
          type: String,
          enum: Object.values(DocumentStatus),
          default: DocumentStatus.PENDING,
        },
      },
    ],

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: OCR EXTRACTED IDENTITY DATA SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 4/10
// OCR EXTRACTED IDENTITY DATA SCHEMA
// ======================================================

    // ==================================================
    // OCR EXTRACTED IDENTITY DATA
    // ==================================================

    ocrData: {
      fullName: {
        type: String,
        default: "",
        trim: true,
      },

      fatherName: {
        type: String,
        default: "",
        trim: true,
      },

      documentNumber: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      dateOfBirth: {
        type: Date,
      },

      gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER", ""],
        default: "",
      },

      nationality: {
        type: String,
        default: "Pakistan",
      },

      religion: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
      },

      district: {
        type: String,
        default: "",
      },

      province: {
        type: String,
        default: "",
      },

      postalCode: {
        type: String,
        default: "",
      },

      confidenceScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      extractedLanguage: {
        type: String,
        default: "URDU_ENGLISH",
      },

      extractedAt: {
        type: Date,
      },
    },

    // ==================================================
    // USER PROVIDED INFORMATION
    // ==================================================

    userProvidedData: {
      fullName: {
        type: String,
        default: "",
        trim: true,
      },

      fatherName: {
        type: String,
        default: "",
        trim: true,
      },

      cnicNumber: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      dateOfBirth: {
        type: Date,
      },

      gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER", ""],
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      province: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // OCR VALIDATION RESULT
    // ==================================================

    ocrValidation: {
      nameMatched: {
        type: Boolean,
        default: false,
      },

      fatherNameMatched: {
        type: Boolean,
        default: false,
      },

      documentMatched: {
        type: Boolean,
        default: false,
      },

      dobMatched: {
        type: Boolean,
        default: false,
      },

      genderMatched: {
        type: Boolean,
        default: false,
      },

      addressMatched: {
        type: Boolean,
        default: false,
      },

      overallMatchScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // ==================================================
    // DATA MISMATCH DETECTION
    // ==================================================

    mismatchDetection: {
      mismatchFound: {
        type: Boolean,
        default: false,
      },

      mismatchedFields: [
        {
          type: String,
        },
      ],

      severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
      },

      requiresManualReview: {
        type: Boolean,
        default: false,
      },

      detectedAt: {
        type: Date,
      },
    },

    // ==================================================
    // MANUAL CORRECTIONS
    // ==================================================

    manualCorrection: {
      correctedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      correctedAt: {
        type: Date,
      },

      fieldsUpdated: [
        {
          field: String,
          oldValue: String,
          newValue: String,
        },
      ],

      correctionReason: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // NADRA / OCR VERIFICATION FLAGS
    // ==================================================

    identityValidation: {
      documentFormatValid: {
        type: Boolean,
        default: false,
      },

      cnicChecksumValid: {
        type: Boolean,
        default: false,
      },

      documentExpired: {
        type: Boolean,
        default: false,
      },

      duplicateIdentityFound: {
        type: Boolean,
        default: false,
      },

      blacklistedIdentity: {
        type: Boolean,
        default: false,
      },

      validationCompletedAt: {
        type: Date,
      },
    },

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: SELFIE VERIFICATION + FACE MATCH + LIVENESS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 5/10
// SELFIE VERIFICATION + FACE MATCH + LIVENESS DETECTION
// ======================================================

    // ==================================================
    // SELFIE VERIFICATION
    // ==================================================

    selfieVerification: {
      selfieImage: {
        type: String,
        default: "",
      },

      uploadedAt: {
        type: Date,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: {
        type: Date,
      },

      verificationStatus: {
        type: String,
        enum: [
          "NOT_STARTED",
          "PENDING",
          "VERIFIED",
          "FAILED",
          "RETRY_REQUIRED",
        ],
        default: "NOT_STARTED",
      },

      // ==========================================
      // FACE MATCH RESULT
      // ==========================================

      faceMatchScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      faceMatched: {
        type: Boolean,
        default: false,
      },

      faceSimilarityThreshold: {
        type: Number,
        default: 85,
      },

      faceBoundingBoxDetected: {
        type: Boolean,
        default: false,
      },

      multipleFacesDetected: {
        type: Boolean,
        default: false,
      },

      faceOccluded: {
        type: Boolean,
        default: false,
      },

      sunglassesDetected: {
        type: Boolean,
        default: false,
      },

      maskDetected: {
        type: Boolean,
        default: false,
      },

      beardDifferenceDetected: {
        type: Boolean,
        default: false,
      },

      ageDifferenceDetected: {
        type: Boolean,
        default: false,
      },

      genderMismatchDetected: {
        type: Boolean,
        default: false,
      },

      // ==========================================
      // LIVENESS DETECTION
      // ==========================================

      livenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      livenessPassed: {
        type: Boolean,
        default: false,
      },

      blinkDetected: {
        type: Boolean,
        default: false,
      },

      smileDetected: {
        type: Boolean,
        default: false,
      },

      headMovementDetected: {
        type: Boolean,
        default: false,
      },

      eyeMovementDetected: {
        type: Boolean,
        default: false,
      },

      challengeCompleted: {
        type: Boolean,
        default: false,
      },

      // ==========================================
      // ANTI-SPOOF / DEEPFAKE DETECTION
      // ==========================================

      spoofDetection: {
        spoofDetected: {
          type: Boolean,
          default: false,
        },

        deepfakeDetected: {
          type: Boolean,
          default: false,
        },

        printedPhotoDetected: {
          type: Boolean,
          default: false,
        },

        screenReplayDetected: {
          type: Boolean,
          default: false,
        },

        syntheticFaceDetected: {
          type: Boolean,
          default: false,
        },

        spoofRiskScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },

      // ==========================================
      // IMAGE QUALITY ANALYSIS
      // ==========================================

      quality: {
        resolutionScore: {
          type: Number,
          default: 0,
        },

        brightnessScore: {
          type: Number,
          default: 0,
        },

        blurScore: {
          type: Number,
          default: 0,
        },

        faceCentered: {
          type: Boolean,
          default: false,
        },

        faceVisible: {
          type: Boolean,
          default: false,
        },

        imageAccepted: {
          type: Boolean,
          default: false,
        },
      },
    },

    // ==================================================
    // CAMERA / DEVICE METADATA
    // ==================================================

    selfieDevice: {
      deviceModel: {
        type: String,
        default: "",
      },

      operatingSystem: {
        type: String,
        default: "",
      },

      appVersion: {
        type: String,
        default: "",
      },

      cameraType: {
        type: String,
        enum: ["FRONT", "BACK", "UNKNOWN"],
        default: "FRONT",
      },

      imageWidth: Number,
      imageHeight: Number,

      capturedAt: Date,

      ipAddress: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      country: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // SELFIE VERIFICATION HISTORY
    // ==================================================

    selfieHistory: [
      {
        selfieImage: String,

        faceMatchScore: Number,

        livenessScore: Number,

        verified: Boolean,

        failureReason: String,

        capturedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==================================================
    // FACE LANDMARK ANALYSIS
    // ==================================================

    biometricAnalysis: {
      noseDetected: {
        type: Boolean,
        default: false,
      },

      eyesDetected: {
        type: Boolean,
        default: false,
      },

      mouthDetected: {
        type: Boolean,
        default: false,
      },

      earsDetected: {
        type: Boolean,
        default: false,
      },

      facialLandmarksDetected: {
        type: Boolean,
        default: false,
      },

      landmarkConfidence: {
        type: Number,
        default: 0,
      },
    },

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: ADDRESS VERIFICATION + PROOF DOCUMENTS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 6/10
// ADDRESS VERIFICATION + PROOF DOCUMENTS
// ======================================================

    // ==================================================
    // ADDRESS VERIFICATION
    // ==================================================

    addressVerification: {
      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: Date,

      documentType: {
        type: String,
        enum: Object.values(AddressDocumentType),
        default: AddressDocumentType.UTILITY_BILL,
      },

      documentImage: {
        type: String,
        default: "",
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },

      // ==========================================
      // USER PROVIDED ADDRESS
      // ==========================================

      address: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
      },

      district: {
        type: String,
        default: "",
      },

      province: {
        type: String,
        default: "",
      },

      postalCode: {
        type: String,
        default: "",
      },

      country: {
        type: String,
        default: "Pakistan",
      },

      // ==========================================
      // OCR EXTRACTED ADDRESS
      // ==========================================

      ocrAddress: {
        address: {
          type: String,
          default: "",
        },

        city: {
          type: String,
          default: "",
        },

        district: {
          type: String,
          default: "",
        },

        province: {
          type: String,
          default: "",
        },

        postalCode: {
          type: String,
          default: "",
        },

        confidenceScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },

        extractedAt: Date,
      },

      // ==========================================
      // ADDRESS MATCH RESULT
      // ==========================================

      matchResult: {
        addressMatched: {
          type: Boolean,
          default: false,
        },

        cityMatched: {
          type: Boolean,
          default: false,
        },

        provinceMatched: {
          type: Boolean,
          default: false,
        },

        postalCodeMatched: {
          type: Boolean,
          default: false,
        },

        overallMatchScore: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },

      // ==========================================
      // DOCUMENT QUALITY
      // ==========================================

      documentQuality: {
        imageQualityScore: {
          type: Number,
          default: 0,
        },

        blurDetected: {
          type: Boolean,
          default: false,
        },

        glareDetected: {
          type: Boolean,
          default: false,
        },

        croppedDetected: {
          type: Boolean,
          default: false,
        },

        readable: {
          type: Boolean,
          default: false,
        },
      },
    },

    // ==================================================
    // GEO LOCATION VERIFICATION
    // ==================================================

    geoVerification: {
      enabled: {
        type: Boolean,
        default: false,
      },

      latitude: {
        type: Number,
        default: 0,
      },

      longitude: {
        type: Number,
        default: 0,
      },

      city: {
        type: String,
        default: "",
      },

      province: {
        type: String,
        default: "",
      },

      ipCountry: {
        type: String,
        default: "",
      },

      ipCity: {
        type: String,
        default: "",
      },

      gpsMatchesAddress: {
        type: Boolean,
        default: false,
      },

      distanceKm: {
        type: Number,
        default: 0,
      },

      verifiedAt: Date,
    },

    // ==================================================
    // RESIDENCE HISTORY
    // ==================================================

    residenceHistory: [
      {
        address: String,

        city: String,

        province: String,

        country: {
          type: String,
          default: "Pakistan",
        },

        fromDate: Date,

        toDate: Date,

        currentResidence: {
          type: Boolean,
          default: false,
        },

        verified: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ==================================================
    // ADDRESS VERIFICATION HISTORY
    // ==================================================

    addressVerificationHistory: [
      {
        documentType: {
          type: String,
          enum: Object.values(AddressDocumentType),
        },

        verified: Boolean,

        verificationScore: Number,

        verifiedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        notes: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: ADMIN APPROVAL + AML / PEP / SANCTIONS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 7/10
// ADMIN APPROVAL + AML / PEP / SANCTIONS WORKFLOW
// ======================================================

    // ==================================================
    // ADMIN REVIEW WORKFLOW
    // ==================================================

    adminReview: {
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: Date,

      decision: {
        type: String,
        enum: Object.values(ReviewDecision),
      },

      reviewStage: {
        type: String,
        enum: [
          "INITIAL_REVIEW",
          "DOCUMENT_REVIEW",
          "FACE_VERIFICATION",
          "AML_SCREENING",
          "FINAL_APPROVAL",
          "REJECTED",
        ],
        default: "INITIAL_REVIEW",
      },

      rejectionReason: {
        type: String,
        default: "",
      },

      notes: {
        type: String,
        default: "",
      },

      priority: {
        type: String,
        enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
        default: "NORMAL",
      },

      assignedReviewer: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewStartedAt: Date,

      reviewCompletedAt: Date,
    },

    // ==================================================
    // AML COMPLIANCE SCREENING
    // ==================================================

    amlCompliance: {
      amlRiskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
      },

      complianceScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },

      manualReviewRequired: {
        type: Boolean,
        default: false,
      },

      sourceOfFundsVerified: {
        type: Boolean,
        default: false,
      },

      sourceOfFundsDocument: {
        type: String,
        default: "",
      },

      occupationVerified: {
        type: Boolean,
        default: false,
      },

      incomeRange: {
        type: String,
        enum: [
          "UNDER_50K",
          "50K_TO_100K",
          "100K_TO_250K",
          "250K_TO_500K",
          "500K_PLUS",
          "",
        ],
        default: "",
      },

      reviewedByCompliance: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: Date,
    },

    // ==================================================
    // PEP SCREENING
    // ==================================================

    pepScreening: {
      screened: {
        type: Boolean,
        default: false,
      },

      pepMatch: {
        type: Boolean,
        default: false,
      },

      matchScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      matchedEntity: {
        type: String,
        default: "",
      },

      relationshipType: {
        type: String,
        default: "",
      },

      screeningDate: Date,

      screeningProvider: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // SANCTIONS SCREENING
    // ==================================================

    sanctionsScreening: {
      screened: {
        type: Boolean,
        default: false,
      },

      sanctionsMatch: {
        type: Boolean,
        default: false,
      },

      sanctionList: {
        type: String,
        default: "",
      },

      matchedEntity: {
        type: String,
        default: "",
      },

      matchScore: {
        type: Number,
        default: 0,
      },

      screeningDate: Date,

      screeningProvider: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // WATCHLIST SCREENING
    // ==================================================

    watchlistScreening: {
      screened: {
        type: Boolean,
        default: false,
      },

      watchlistMatch: {
        type: Boolean,
        default: false,
      },

      listName: {
        type: String,
        default: "",
      },

      matchScore: {
        type: Number,
        default: 0,
      },

      reviewed: {
        type: Boolean,
        default: false,
      },

      reviewedAt: Date,
    },

    // ==================================================
    // ENHANCED DUE DILIGENCE (EDD)
    // ==================================================

    enhancedDueDiligence: {
      required: {
        type: Boolean,
        default: false,
      },

      completed: {
        type: Boolean,
        default: false,
      },

      reason: {
        type: String,
        default: "",
      },

      additionalDocuments: [
        {
          documentName: String,
          documentImage: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      completedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      completedAt: Date,
    },

    // ==================================================
    // COMPLIANCE ESCALATION
    // ==================================================

    escalation: {
      escalated: {
        type: Boolean,
        default: false,
      },

      escalationReason: {
        type: String,
        default: "",
      },

      escalatedTo: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      escalatedAt: Date,

      resolved: {
        type: Boolean,
        default: false,
      },

      resolvedAt: Date,
    },

    // ==================================================
    // AUDIT TRAIL
    // ==================================================

    auditTrail: [
      {
        action: {
          type: String,
          enum: [
            "SUBMITTED",
            "UNDER_REVIEW",
            "OCR_COMPLETED",
            "FACE_VERIFIED",
            "AML_SCREENED",
            "APPROVED",
            "REJECTED",
            "RESUBMISSION_REQUESTED",
            "EDD_REQUIRED",
            "ESCALATED",
          ],
          required: true,
        },

        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        notes: {
          type: String,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },

        ipAddress: {
          type: String,
          default: "",
        },
      },
    ],

    // ==================================================
    // NOTIFICATION HISTORY
    // ==================================================

    notifications: {
      emailSent: {
        type: Boolean,
        default: false,
      },

      smsSent: {
        type: Boolean,
        default: false,
      },

      pushSent: {
        type: Boolean,
        default: false,
      },

      lastNotificationAt: Date,

      history: [
        {
          channel: {
            type: String,
            enum: ["EMAIL", "SMS", "PUSH", "SYSTEM"],
          },

          status: {
            type: String,
            enum: ["SENT", "FAILED", "PENDING"],
            default: "PENDING",
          },

          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: INDEXES + VIRTUAL FIELDS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 8/10
// INDEXES + VIRTUAL FIELDS
// ======================================================

// ======================================================
// PRIMARY DATABASE INDEXES
// ======================================================

KYCSchema.index({ user: 1 }, { unique: true });
KYCSchema.index({ applicationId: 1 }, { unique: true });

KYCSchema.index({ status: 1 });
KYCSchema.index({ verificationLevel: 1 });

// ======================================================
// DOCUMENT INDEXES
// ======================================================

KYCSchema.index({ "identityDocument.documentNumber": 1 });
KYCSchema.index({ "identityDocument.status": 1 });
KYCSchema.index({ "passportVerification.passportNumber": 1 });

// ======================================================
// REVIEW & AML INDEXES
// ======================================================

KYCSchema.index({ "adminReview.reviewStage": 1 });
KYCSchema.index({ "amlCompliance.amlRiskLevel": 1 });
KYCSchema.index({ "pepScreening.pepMatch": 1 });
KYCSchema.index({ "sanctionsScreening.sanctionsMatch": 1 });

// ======================================================
// DATE INDEXES
// ======================================================

KYCSchema.index({ submittedAt: -1 });
KYCSchema.index({ approvedAt: -1 });
KYCSchema.index({ expiresAt: 1 });

// ======================================================
// VIRTUAL : IS APPROVED
// ======================================================

KYCSchema.virtual("isApproved").get(function () {
  const self: any = this;
  return self.status === KYCStatus.APPROVED;
});

// ======================================================
// VIRTUAL : IS PENDING REVIEW
// ======================================================

KYCSchema.virtual("isPending").get(function () {
  const self: any = this;
  return (
    self.status === KYCStatus.PENDING ||
    self.status === KYCStatus.UNDER_REVIEW
  );
});

// ======================================================
// VIRTUAL : IS REJECTED
// ======================================================

KYCSchema.virtual("isRejected").get(function () {
  const self: any = this;
  return self.status === KYCStatus.REJECTED;
});

// ======================================================
// VIRTUAL : IS EXPIRED
// ======================================================

KYCSchema.virtual("isExpired").get(function () {
  const self: any = this;
  if (!self.expiresAt) return false;

  return new Date() > self.expiresAt;
});

// ======================================================
// VIRTUAL : LEVEL 3 VERIFIED
// ======================================================

KYCSchema.virtual("isLevel3Verified").get(function () {
  const self: any = this;
  return (
    self.verificationLevel === VerificationLevel.LEVEL_3 &&
    self.status === KYCStatus.APPROVED
  );
});

// ======================================================
// VIRTUAL : ENHANCED DUE DILIGENCE REQUIRED
// ======================================================

KYCSchema.virtual("requiresEDD").get(function () {
  const self: any = this;
  return (
    self.riskProfile && self.riskProfile.enhancedDueDiligence ||
    self.enhancedDueDiligence && self.enhancedDueDiligence.required
  );
});

// ======================================================
// VIRTUAL : AML STATUS SUMMARY
// ======================================================

KYCSchema.virtual("amlStatus").get(function () {
  const self: any = this;
  return {
    riskLevel: self.amlCompliance && self.amlCompliance.amlRiskLevel,
    score: self.amlCompliance && self.amlCompliance.complianceScore,
    pepMatch: self.pepScreening && self.pepScreening.pepMatch,
    sanctionsMatch: self.sanctionsScreening && self.sanctionsScreening.sanctionsMatch,
    manualReview: self.amlCompliance && self.amlCompliance.manualReviewRequired,
  };
});

// ======================================================
// VIRTUAL : KYC COMPLETION PERCENTAGE
// ======================================================

KYCSchema.virtual("completionPercentage").get(function () {
  const self: any = this;
  let completed = 0;

  if (self.completion && self.completion.cnicUploaded) completed += 20;
  if (self.completion && self.completion.ocrCompleted) completed += 15;
  if (self.completion && self.completion.selfieUploaded) completed += 20;
  if (self.completion && self.completion.faceMatched) completed += 15;
  if (self.completion && self.completion.addressUploaded) completed += 20;
  if (self.completion && self.completion.amlCompleted) completed += 10;

  return Math.min(completed, 100);
});

// ======================================================
// VIRTUAL : FACE VERIFICATION SUMMARY
// ======================================================

KYCSchema.virtual("faceVerificationSummary").get(function () {
  const self: any = this;
  return {
    verified: self.selfieVerification && self.selfieVerification.verified,
    faceMatchScore: self.selfieVerification && self.selfieVerification.faceMatchScore,
    livenessScore: self.selfieVerification && self.selfieVerification.livenessScore,
    spoofDetected:
      self.selfieVerification && self.selfieVerification.spoofDetection && self.selfieVerification.spoofDetection.spoofDetected,
  };
});

// ======================================================
// VIRTUAL : DOCUMENT SUMMARY
// ======================================================

KYCSchema.virtual("documentSummary").get(function () {
  const self: any = this;
  return {
    type: self.identityDocument && self.identityDocument.type,
    number: self.identityDocument && self.identityDocument.documentNumber,
    status: self.identityDocument && self.identityDocument.status,
    uploadedAt: self.identityDocument && self.identityDocument.uploadedAt,
    verifiedAt: self.identityDocument && self.identityDocument.verifiedAt,
  };
});

// ======================================================
// VIRTUAL : VERIFICATION SUMMARY
// ======================================================

KYCSchema.virtual("verificationSummary").get(function () {
  const self: any = this;
  return {
    status: self.status,
    level: self.verificationLevel,
    completion: self.completionPercentage,
    riskLevel: self.riskProfile && self.riskProfile.riskLevel,
    approved: self.isApproved,
  };
});

// ======================================================
// VIRTUAL : DAYS UNTIL EXPIRY
// ======================================================

KYCSchema.virtual("daysUntilExpiry").get(function () {
  const self: any = this;
  if (!self.expiresAt) return null;

  const diff =
    new Date(self.expiresAt).getTime() - Date.now();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ======================================================
// JSON / OBJECT OPTIONS
// ======================================================

KYCSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

KYCSchema.set("toObject", {
  virtuals: true,
});

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: PRE-SAVE HOOKS + VERIFICATION METHODS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 9/10
// PRE-SAVE HOOKS + VERIFICATION METHODS
// ======================================================

// ======================================================
// AUTO GENERATE KYC APPLICATION ID
// FORMAT: GTKYC-2026-A1B2C3D4
// ======================================================

KYCSchema.pre("save", function (next) {
  const self: any = this;
  if (!self.applicationId) {
    const random = Math.random()
      .toString(16)
      .substring(2, 10)
      .toUpperCase();

    const year = new Date().getFullYear();

    self.applicationId = `GTKYC-${year}-${random}`;
  }

  next();
});

// ======================================================
// AUTO UPDATE LAST MODIFIED DATE
// ======================================================

KYCSchema.pre("save", function (next) {
  const self: any = this;
  self.lastUpdatedAt = new Date();
  next();
});

// ======================================================
// AUTO CALCULATE COMPLETION PERCENTAGE
// ======================================================

KYCSchema.pre("save", function (next) {
  const self: any = this;
  let percentage = 0;

  if (self.completion && self.completion.cnicUploaded) percentage += 20;
  if (self.completion && self.completion.ocrCompleted) percentage += 15;
  if (self.completion && self.completion.selfieUploaded) percentage += 20;
  if (self.completion && self.completion.faceMatched) percentage += 15;
  if (self.completion && self.completion.addressUploaded) percentage += 20;
  if (self.completion && self.completion.amlCompleted) percentage += 10;

  self.completion = self.completion || {};
  self.completion.percentage = Math.min(percentage, 100);

  next();
});

// ======================================================
// AUTO DETERMINE VERIFICATION LEVEL
// ======================================================

KYCSchema.pre("save", function (next) {
  const self: any = this;
  if (self.completion && self.completion.percentage >= 100) {
    self.verificationLevel = VerificationLevel.LEVEL_3;
  } else if (
    self.completion && self.completion.selfieUploaded &&
    self.completion.faceMatched
  ) {
    self.verificationLevel = VerificationLevel.LEVEL_2;
  } else if (self.completion && self.completion.cnicUploaded) {
    self.verificationLevel = VerificationLevel.LEVEL_1;
  } else {
    self.verificationLevel = VerificationLevel.LEVEL_0;
  }

  next();
});

// ======================================================
// AUTO CALCULATE RISK SCORE
// ======================================================

KYCSchema.pre("save", function (next) {
  const self: any = this;
  let score = 0;

  if (self.pepScreening && self.pepScreening.pepMatch) score += 35;
  if (self.sanctionsScreening && self.sanctionsScreening.sanctionsMatch) score += 50;
  if (self.watchlistScreening && self.watchlistScreening.watchlistMatch) score += 25;
  if (self.mismatchDetection && self.mismatchDetection.mismatchFound) score += 15;
  if (self.selfieVerification && self.selfieVerification.spoofDetection && self.selfieVerification.spoofDetection.spoofDetected) score += 25;
  if (self.selfieVerification && self.selfieVerification.spoofDetection && self.selfieVerification.spoofDetection.deepfakeDetected) score += 40;
  if (self.identityValidation && self.identityValidation.duplicateIdentityFound) score += 30;
  if (self.identityValidation && self.identityValidation.blacklistedIdentity) score += 50;

  score = Math.min(score, 100);

  self.riskProfile = self.riskProfile || {};
  self.amlCompliance = self.amlCompliance || {};
  self.riskProfile.riskScore = score;
  self.amlCompliance.complianceScore = Math.max(100 - score, 0);

  if (score >= 75) {
    self.riskProfile.riskLevel = "CRITICAL";
    self.amlCompliance.amlRiskLevel = "CRITICAL";
    self.amlCompliance.manualReviewRequired = true;
  } else if (score >= 50) {
    self.riskProfile.riskLevel = "HIGH";
    self.amlCompliance.amlRiskLevel = "HIGH";
    self.amlCompliance.manualReviewRequired = true;
  } else if (score >= 25) {
    self.riskProfile.riskLevel = "MEDIUM";
    self.amlCompliance.amlRiskLevel = "MEDIUM";
  } else {
    self.riskProfile.riskLevel = "LOW";
    self.amlCompliance.amlRiskLevel = "LOW";
  }

  next();
});

// ======================================================
// APPROVE KYC METHOD
// ======================================================

KYCSchema.methods.approveKYC = async function (
  adminId: mongoose.Types.ObjectId
): Promise<IKYC> {
  this.status = KYCStatus.APPROVED;

  this.approvedAt = new Date();
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.decision = ReviewDecision.APPROVE;
  this.adminReview.reviewStage = "FINAL_APPROVAL";

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 5);
  this.expiresAt = expiry;

  this.auditTrail.unshift({
    action: "APPROVED",
    performedBy: adminId,
    notes: "KYC approved successfully.",
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// REJECT KYC METHOD
// ======================================================

KYCSchema.methods.rejectKYC = async function (
  adminId: mongoose.Types.ObjectId,
  reason: string
): Promise<IKYC> {
  this.status = KYCStatus.REJECTED;

  this.rejectedAt = new Date();
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.decision = ReviewDecision.REJECT;
  this.adminReview.reviewStage = "REJECTED";
  this.adminReview.rejectionReason = reason;

  this.auditTrail.unshift({
    action: "REJECTED",
    performedBy: adminId,
    notes: reason,
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// REQUEST RESUBMISSION METHOD
// ======================================================

KYCSchema.methods.requestResubmission = async function (
  adminId: mongoose.Types.ObjectId,
  reason: string,
  days = 7
): Promise<IKYC> {
  this.status = KYCStatus.RESUBMISSION_REQUIRED;

  this.resubmission.required = true;
  this.resubmission.attempts += 1;
  this.resubmission.reason = reason;
  this.resubmission.requestedAt = new Date();

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  this.resubmission.deadline = deadline;

  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.decision =
    ReviewDecision.REQUEST_RESUBMISSION;

  this.auditTrail.unshift({
    action: "RESUBMISSION_REQUESTED",
    performedBy: adminId,
    notes: reason,
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// ADD AUDIT ENTRY METHOD
// ======================================================

KYCSchema.methods.addAuditEntry = async function ({
  action,
  performedBy,
  notes,
  ipAddress,
}: {
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  notes?: string;
  ipAddress?: string;
}) {
  this.auditTrail.unshift({
    action,
    performedBy,
    notes,
    ipAddress,
    createdAt: new Date(),
  });

  if (this.auditTrail.length > 200) {
    this.auditTrail = this.auditTrail.slice(0, 200);
  }

  return this.save();
};

// ======================================================
// CHECK KYC EXPIRY
// ======================================================

KYCSchema.methods.checkExpiry = async function (): Promise<IKYC> {
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = KYCStatus.EXPIRED;
  }

  return this.save();
};

// ======================================================
// LIMIT AUDIT HISTORY SIZE
// ======================================================

KYCSchema.pre("save", function (next) {
  const self: any = this;

  if (self.auditTrail && self.auditTrail.length > 200) {
    self.auditTrail = self.auditTrail.slice(0, 200);
  }

  if (self.notifications && self.notifications.history && self.notifications.history.length > 100) {
    self.notifications.history =
      self.notifications.history.slice(0, 100);
  }

  next();
});

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: MODEL EXPORT + STATIC METHODS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/KYC.ts
// SECTION 10/10
// FINAL SCHEMA OPTIONS + STATIC METHODS + MODEL EXPORT
// ======================================================

// ======================================================
// SCHEMA OPTIONS
// ======================================================

KYCSchema.set("timestamps", true);

KYCSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

KYCSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// INSTANCE METHODS INTERFACE
// ======================================================

export interface IKYCMethods {
  approveKYC(adminId: mongoose.Types.ObjectId): Promise<IKYC>;

  rejectKYC(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IKYC>;

  requestResubmission(
    adminId: mongoose.Types.ObjectId,
    reason: string,
    days?: number
  ): Promise<IKYC>;

  checkExpiry(): Promise<IKYC>;

  addAuditEntry(data: {
    action: string;
    performedBy?: mongoose.Types.ObjectId;
    notes?: string;
    ipAddress?: string;
  }): Promise<IKYC>;
}

// ======================================================
// STATIC MODEL INTERFACE
// ======================================================

export interface IKYCModel extends Model<IKYC> {
  findPendingReviews(): Promise<IKYC[]>;

  findApprovedKYC(): Promise<IKYC[]>;

  findHighRiskKYC(): Promise<IKYC[]>;

  findExpiredKYC(): Promise<IKYC[]>;

  findByDocumentNumber(documentNumber: string): Promise<IKYC | null>;

  findByApplicationId(applicationId: string): Promise<IKYC | null>;
}

// ======================================================
// STATIC METHODS
// ======================================================

// Pending Review Queue
KYCSchema.statics.findPendingReviews = function () {
  return this.find({
    status: {
      $in: [KYCStatus.PENDING, KYCStatus.UNDER_REVIEW],
    },
  }).sort({ submittedAt: 1 });
};

// Approved Users
KYCSchema.statics.findApprovedKYC = function () {
  return this.find({
    status: KYCStatus.APPROVED,
  }).sort({ approvedAt: -1 });
};

// High Risk Queue
KYCSchema.statics.findHighRiskKYC = function () {
  return this.find({
    "riskProfile.riskLevel": {
      $in: ["HIGH", "CRITICAL"],
    },
  }).sort({ "riskProfile.riskScore": -1 });
};

// Expired KYC Records
KYCSchema.statics.findExpiredKYC = function () {
  return this.find({
    expiresAt: {
      $lt: new Date(),
    },
  }).sort({ expiresAt: 1 });
};

// Search by CNIC / Passport Number
KYCSchema.statics.findByDocumentNumber = function (
  documentNumber: string
) {
  return this.findOne({
    "identityDocument.documentNumber": documentNumber,
  });
};

// Search by Application ID
KYCSchema.statics.findByApplicationId = function (
  applicationId: string
) {
  return this.findOne({ applicationId });
};

// ======================================================
// CREATE MODEL
// ======================================================

const KYC =
  (mongoose.models.KYC as IKYCModel) ||
  mongoose.model<IKYC, IKYCModel>("KYC", KYCSchema);

// ======================================================
// EXPORT MODEL
// ======================================================

export default KYC;

// ======================================================
// END OF FILE
// backend/src/models/KYC.ts
// GOLDTRADE V17 ENTERPRISE KYC MODEL COMPLETE
// ======================================================
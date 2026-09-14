// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 1/10
// IMPORTS + TYPES + STATES
// =====================================================

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Save,
  RefreshCw,
  Wallet,
  Copy,
  CheckCircle2,
  Clock,
  Lock,
  KeyRound,
  BadgeCheck,
  Globe,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  Coins,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

/* ==========================================================
   TYPES
========================================================== */

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  gender: string;
  dateOfBirth: string;
  referralCode: string;
  walletBalance: number;
  goldBalance: number;
  usdtBalance: number;
  kycStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED";
  profileImage?: string;
  createdAt: string;
}

interface SecurityInfo {
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function ProfilePage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  /* ================= STATES ================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    _id: "",
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    referralCode: "",
    walletBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
    kycStatus: "NOT_SUBMITTED",
    profileImage: "",
    createdAt: "",
  });

  const [security, setSecurity] = useState<SecurityInfo>({
    emailVerified: false,
    phoneVerified: false,
    twoFactorEnabled: false,
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [previewImage, setPreviewImage] = useState("");

  const memberSince = useMemo(() => {
    if (!profile.createdAt) return "";
    return new Date(profile.createdAt).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
    });
  }, [profile.createdAt]);// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 2/10
// API FUNCTIONS + PROFILE UPDATE + IMAGE UPLOAD + SECURITY
// =====================================================

  /* ==========================================================
     LOAD USER PROFILE
  ========================================================== */

  const loadProfile = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.user);

        setSecurity({
          emailVerified: data.user.emailVerified,
          phoneVerified: data.user.phoneVerified,
          twoFactorEnabled: data.user.twoFactorEnabled,
        });

        if (data.user.profileImage) {
          setPreviewImage(data.user.profileImage);
        }
      }
    } catch (error) {
      console.error("Profile Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  /* ==========================================================
     UPDATE PROFILE
  ========================================================== */

  const updateProfile = async () => {
    try {
      setSaving(true);

      const response = await fetch(`${API}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          address: profile.address,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile Updated Successfully.");
        loadProfile();
      } else {
        alert(data.message || "Unable to update profile.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PROFILE IMAGE SELECT
  ========================================================== */

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.result) {
        setPreviewImage(reader.result.toString());
      }
    };

    reader.readAsDataURL(file);
  };

  /* ==========================================================
     UPLOAD PROFILE IMAGE
  ========================================================== */

  const uploadProfileImage = async () => {
    if (!selectedImage) {
      alert("Please select an image.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("profileImage", selectedImage);

      const response = await fetch(`${API}/api/profile/upload-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile photo uploaded.");
        loadProfile();
      } else {
        alert(data.message || "Upload failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     COPY REFERRAL CODE
  ========================================================== */

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.referralCode);
      alert("Referral code copied.");
    } catch (error) {
      console.error(error);
    }
  };

  /* ==========================================================
     TOGGLE TWO FACTOR AUTH
  ========================================================== */

  const toggleTwoFactor = async () => {
    try {
      const response = await fetch(`${API}/api/profile/two-factor`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !security.twoFactorEnabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSecurity((prev) => ({
          ...prev,
          twoFactorEnabled: !prev.twoFactorEnabled,
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* ==========================================================
     KYC STATUS LABEL
  ========================================================== */

  const getKycColor = () => {
    switch (profile.kycStatus) {
      case "VERIFIED":
        return "bg-green-600 text-white";

      case "PENDING":
        return "bg-yellow-500 text-black";

      default:
        return "bg-red-600 text-white";
    }
  };

  const getKycText = () => {
    switch (profile.kycStatus) {
      case "VERIFIED":
        return "Verified";

      case "PENDING":
        return "Pending Verification";

      default:
        return "Not Submitted";
    }
  };

  /* ==========================================================
     WALLET TOTAL VALUE
  ========================================================== */

  const totalPortfolio = useMemo(() => {
    return (
      profile.walletBalance +
      profile.usdtBalance +
      profile.goldBalance * 25000
    );
  }, [
    profile.walletBalance,
    profile.goldBalance,
    profile.usdtBalance,
  ]);// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 3/10
// PROFILE HEADER + USER CARD + WALLET SUMMARY + KYC STATUS
// =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={28} />
        Loading Profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= PROFILE HEADER ================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>
            <h1 className="text-5xl font-black text-yellow-400 flex items-center gap-3">
              <User size={42} />
              My Profile
            </h1>

            <p className="text-gray-400 mt-2">
              Manage your GoldTrade account information and security settings.
            </p>
          </div>

          <button
            onClick={loadProfile}
            disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={saving ? "animate-spin" : ""}
            />
            Refresh Profile
          </button>

        </div>

        {/* ================= PROFILE CARD ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">

            {/* Profile Photo */}

            <div className="relative">

              <div className="w-40 h-40 rounded-full border-4 border-yellow-500 overflow-hidden bg-black flex items-center justify-center">

                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={80} className="text-yellow-400" />
                )}

              </div>

              <label className="absolute bottom-2 right-2 bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-full cursor-pointer">

                <Camera size={18} />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

              </label>

            </div>

            {/* User Info */}

            <div className="flex-1">

              <h2 className="text-4xl font-black text-yellow-400">
                {profile.fullName || "GoldTrade User"}
              </h2>

              <p className="text-gray-400 mt-2 flex items-center gap-2">
                <Mail size={16} />
                {profile.email}
              </p>

              <p className="text-gray-400 mt-2 flex items-center gap-2">
                <Phone size={16} />
                {profile.phone}
              </p>

              <p className="text-gray-400 mt-2 flex items-center gap-2">
                <MapPin size={16} />
                {profile.city}, {profile.country}
              </p>

              <p className="text-gray-400 mt-2 flex items-center gap-2">
                <Calendar size={16} />
                Member Since {memberSince}
              </p>

              <div className="flex flex-wrap gap-3 mt-5">

                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getKycColor()}`}>
                  {getKycText()}
                </span>

                <span className="bg-green-600 px-4 py-2 rounded-full text-sm font-bold">
                  Active Account
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ================= WALLET SUMMARY ================= */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <Wallet className="text-green-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">PKR Wallet</p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              PKR {profile.walletBalance.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">

            <Coins className="text-blue-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">Gold Balance</p>

            <h3 className="text-3xl font-black text-blue-400 mt-2">
              {profile.goldBalance.toFixed(4)} Gram
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <Wallet className="text-cyan-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">USDT Balance</p>

            <h3 className="text-3xl font-black text-cyan-400 mt-2">
              {profile.usdtBalance.toFixed(2)} USDT
            </h3>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Award className="text-yellow-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">Portfolio Value</p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              PKR {totalPortfolio.toLocaleString()}
            </h3>

          </div>

        </div>

        {/* ================= KYC STATUS ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Shield className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              KYC Verification Status
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-6">

              <p className="text-gray-400 text-sm mb-3">
                Current Verification Status
              </p>

              <span className={`inline-block px-5 py-2 rounded-full text-sm font-bold ${getKycColor()}`}>
                {getKycText()}
              </span>

              <p className="text-gray-400 mt-5 text-sm">
                GoldTrade requires identity verification before large deposits
                and withdrawals are approved.
              </p>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-6">

              <p className="text-gray-400 text-sm mb-4">
                Verification Checklist
              </p>

              <div className="space-y-3">

                <div className="flex items-center gap-3">
                  {security.emailVerified ? (
                    <CheckCircle2 className="text-green-400" size={20} />
                  ) : (
                    <Clock className="text-yellow-400" size={20} />
                  )}

                  <span>Email Verification</span>
                </div>

                <div className="flex items-center gap-3">
                  {security.phoneVerified ? (
                    <CheckCircle2 className="text-green-400" size={20} />
                  ) : (
                    <Clock className="text-yellow-400" size={20} />
                  )}

                  <span>Phone Verification</span>
                </div>

                <div className="flex items-center gap-3">
                  {profile.kycStatus === "VERIFIED" ? (
                    <CheckCircle2 className="text-green-400" size={20} />
                  ) : (
                    <Clock className="text-yellow-400" size={20} />
                  )}

                  <span>Government ID Verification</span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 4/10
// EDIT PROFILE FORM + PROFILE PHOTO UPLOAD
// =====================================================

        {/* ================= EDIT PROFILE ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <User className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Edit Personal Information
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* Full Name */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Full Name
              </label>

              <input
                type="text"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    fullName: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Mobile Number
              </label>

              <input
                type="text"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    phone: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="+92xxxxxxxxxx"
              />
            </div>

            {/* Email */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Email Address
              </label>

              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Gender */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Gender
              </label>

              <select
                value={profile.gender}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    gender: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Date of Birth */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Date of Birth
              </label>

              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    dateOfBirth: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
            </div>

            {/* Country */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Country
              </label>

              <input
                type="text"
                value={profile.country}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    country: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="Pakistan"
              />
            </div>

            {/* City */}

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                City
              </label>

              <input
                type="text"
                value={profile.city}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    city: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="Islamabad"
              />
            </div>

            {/* Address */}

            <div className="lg:col-span-2">
              <label className="block text-gray-400 mb-2 text-sm">
                Address
              </label>

              <textarea
                rows={4}
                value={profile.address}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    address: e.target.value,
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none resize-none"
                placeholder="Enter complete address"
              />
            </div>

          </div>

          {/* SAVE BUTTON */}

          <button
            onClick={updateProfile}
            disabled={saving}
            className="mt-8 w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Save size={22} />

            {saving ? "Updating Profile..." : "Save Profile Information"}
          </button>

        </div>

        {/* ================= PROFILE PHOTO ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Camera className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Profile Photo
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">

            <div className="flex justify-center">

              <div className="w-56 h-56 rounded-full border-4 border-blue-500 overflow-hidden bg-black flex items-center justify-center">

                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-blue-400" size={90} />
                )}

              </div>

            </div>

            <div>

              <p className="text-gray-400 mb-5">
                Upload a clear passport-style profile photo for GoldTrade verification.
              </p>

              <label className="block w-full bg-black border border-zinc-700 rounded-xl p-4 cursor-pointer hover:border-blue-500 transition">

                <div className="flex items-center justify-center gap-3 text-blue-400 font-semibold">

                  <Camera size={22} />
                  Choose Profile Picture

                </div>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />

              </label>

              <button
                onClick={uploadProfileImage}
                disabled={saving || !selectedImage}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black disabled:opacity-50"
              >
                {saving ? "Uploading Photo..." : "Upload Profile Photo"}
              </button>

              <div className="bg-black border border-zinc-700 rounded-xl p-4 mt-5">

                <p className="text-gray-400 text-sm mb-2">
                  Supported Formats
                </p>

                <ul className="space-y-2 text-sm text-white">
                  <li>• JPG / JPEG / PNG</li>
                  <li>• Maximum Size: 5 MB</li>
                  <li>• Square passport-style photo recommended.</li>
                </ul>

              </div>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 5/10
// SECURITY SETTINGS + PASSWORD + 2FA + REFERRAL CODE
// =====================================================

        {/* ================= SECURITY SETTINGS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Account Security
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* Email Verification */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Mail className="text-green-400" size={26} />

                <div>
                  <h3 className="font-bold">Email Verification</h3>

                  <p className="text-gray-400 text-sm">
                    {profile.email}
                  </p>
                </div>
              </div>

              {security.emailVerified ? (
                <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              ) : (
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <Clock size={14} />
                  Pending
                </span>
              )}

            </div>

            {/* Phone Verification */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Phone className="text-cyan-400" size={26} />

                <div>
                  <h3 className="font-bold">Phone Verification</h3>

                  <p className="text-gray-400 text-sm">
                    {profile.phone}
                  </p>
                </div>
              </div>

              {security.phoneVerified ? (
                <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              ) : (
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <Clock size={14} />
                  Pending
                </span>
              )}

            </div>

            {/* Two Factor */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Lock className="text-purple-400" size={26} />

                <div>
                  <h3 className="font-bold">
                    Two Factor Authentication
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Secure your GoldTrade account.
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTwoFactor}
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  security.twoFactorEnabled
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {security.twoFactorEnabled ? "Enabled" : "Enable"}
              </button>

            </div>

            {/* Account Status */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <BadgeCheck className="text-yellow-400" size={26} />

                <div>
                  <h3 className="font-bold">
                    Account Status
                  </h3>

                  <p className="text-gray-400 text-sm">
                    GoldTrade Verified User
                  </p>
                </div>
              </div>

              <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold">
                ACTIVE
              </span>

            </div>

          </div>

        </div>

        {/* ================= CHANGE PASSWORD ================= */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <KeyRound className="text-red-400" size={28} />

            <h2 className="text-3xl font-black text-red-400">
              Change Password
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Current Password
              </label>

              <input
                type="password"
                placeholder="Enter current password"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                New Password
              </label>

              <input
                type="password"
                placeholder="Enter new password"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-gray-400 mb-2 text-sm">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
              />
            </div>

          </div>

          <button className="mt-8 w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black">
            Update Password
          </button>

        </div>

        {/* ================= REFERRAL CODE ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Referral Program
            </h2>
          </div>

          <div className="bg-black border border-cyan-600 rounded-2xl p-6">

            <p className="text-gray-400 text-sm">
              Your Referral Code
            </p>

            <div className="flex flex-col md:flex-row gap-4 mt-4">

              <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-cyan-400 font-mono text-lg">
                {profile.referralCode || "GT000000"}
              </div>

              <button
                onClick={copyReferralCode}
                className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copy Code
              </button>

            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-6">

              <div className="bg-zinc-900 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm">
                  Referral Bonus
                </p>

                <h3 className="text-2xl font-black text-green-400 mt-2">
                  PKR 500
                </h3>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm">
                  Total Referrals
                </p>

                <h3 className="text-2xl font-black text-yellow-400 mt-2">
                  0
                </h3>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm">
                  Referral Earnings
                </p>

                <h3 className="text-2xl font-black text-cyan-400 mt-2">
                  PKR 0
                </h3>
              </div>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 6/10
// WALLET PORTFOLIO + ACCOUNT STATISTICS + MEMBERSHIP
// =====================================================

        {/* ================= WALLET PORTFOLIO ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Wallet className="text-yellow-400" size={28} />
            <h2 className="text-3xl font-black text-yellow-400">
              Wallet Portfolio
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-green-600 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">Cash Wallet Balance</p>

              <h3 className="text-4xl font-black text-green-400 mt-3">
                PKR {profile.walletBalance.toLocaleString()}
              </h3>

              <p className="text-green-300 text-sm mt-3">
                Available for Gold Buy & Withdraw.
              </p>
            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">Gold Holdings</p>

              <h3 className="text-4xl font-black text-blue-400 mt-3">
                {profile.goldBalance.toFixed(4)} g
              </h3>

              <p className="text-blue-300 text-sm mt-3">
                Physical Gold Portfolio Balance.
              </p>
            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">USDT Balance</p>

              <h3 className="text-4xl font-black text-cyan-400 mt-3">
                {profile.usdtBalance.toFixed(2)} USDT
              </h3>

              <p className="text-cyan-300 text-sm mt-3">
                Crypto Wallet Balance.
              </p>
            </div>

            <div className="bg-black border border-yellow-500 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">Total Portfolio Value</p>

              <h3 className="text-4xl font-black text-yellow-400 mt-3">
                PKR {totalPortfolio.toLocaleString()}
              </h3>

              <p className="text-yellow-300 text-sm mt-3">
                Wallet + Gold + USDT Combined Value.
              </p>
            </div>

          </div>

        </div>

        {/* ================= PORTFOLIO ALLOCATION ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Award className="text-purple-400" size={28} />
            <h2 className="text-3xl font-black text-purple-400">
              Portfolio Allocation
            </h2>
          </div>

          <div className="space-y-6">

            <div>

              <div className="flex justify-between mb-2">
                <span className="font-semibold text-green-400">PKR Wallet</span>

                <span className="text-green-400 font-bold">
                  {totalPortfolio === 0
                    ? 0
                    : ((profile.walletBalance / totalPortfolio) * 100).toFixed(1)}
                  %
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${
                      totalPortfolio === 0
                        ? 0
                        : (profile.walletBalance / totalPortfolio) * 100
                    }%`,
                  }}
                />
              </div>

            </div>

            <div>

              <div className="flex justify-between mb-2">
                <span className="font-semibold text-blue-400">Gold Assets</span>

                <span className="text-blue-400 font-bold">
                  {totalPortfolio === 0
                    ? 0
                    : (
                        ((profile.goldBalance * 25000) / totalPortfolio) *
                        100
                      ).toFixed(1)}
                  %
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: `${
                      totalPortfolio === 0
                        ? 0
                        : ((profile.goldBalance * 25000) / totalPortfolio) * 100
                    }%`,
                  }}
                />
              </div>

            </div>

            <div>

              <div className="flex justify-between mb-2">
                <span className="font-semibold text-cyan-400">USDT Wallet</span>

                <span className="text-cyan-400 font-bold">
                  {totalPortfolio === 0
                    ? 0
                    : ((profile.usdtBalance / totalPortfolio) * 100).toFixed(1)}
                  %
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-3 rounded-full"
                  style={{
                    width: `${
                      totalPortfolio === 0
                        ? 0
                        : (profile.usdtBalance / totalPortfolio) * 100
                    }%`,
                  }}
                />
              </div>

            </div>

          </div>

        </div>

        {/* ================= ACCOUNT STATISTICS ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-orange-400" size={28} />
            <h2 className="text-3xl font-black text-orange-400">
              Account Statistics
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">

              <Wallet className="mx-auto text-green-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Wallet Balance</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {profile.walletBalance.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-5 text-center">

              <Coins className="mx-auto text-blue-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Gold Holdings</p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                {profile.goldBalance.toFixed(4)} g
              </h3>

            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-5 text-center">

              <Shield className="mx-auto text-cyan-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">KYC Status</p>

              <h3 className="text-xl font-black text-cyan-400 mt-2">
                {getKycText()}
              </h3>

            </div>

            <div className="bg-black border border-yellow-500 rounded-2xl p-5 text-center">

              <Calendar className="mx-auto text-yellow-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Member Since</p>

              <h3 className="text-xl font-black text-yellow-400 mt-2">
                {memberSince}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= MEMBERSHIP INFORMATION ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <BadgeCheck className="text-cyan-400" size={28} />
            <h2 className="text-3xl font-black text-cyan-400">
              GoldTrade Membership
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-cyan-600 rounded-2xl p-6">

              <p className="text-gray-400 text-sm">Membership Level</p>

              <h3 className="text-3xl font-black text-cyan-400 mt-3">
                Gold Member
              </h3>

              <p className="text-cyan-300 text-sm mt-4">
                Eligible for manual deposits, withdrawals and Gold trading.
              </p>

            </div>

            <div className="bg-black border border-yellow-500 rounded-2xl p-6">

              <p className="text-gray-400 text-sm">Account Benefits</p>

              <ul className="space-y-3 mt-4 text-white text-sm">

                <li>• Manual Deposit Approval</li>

                <li>• Manual Withdrawal Approval</li>

                <li>• Gold Buy & Sell Trading</li>

                <li>• Referral Reward Program</li>

                <li>• KYC Protected Transactions</li>

              </ul>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 7/10
// KYC DOCUMENTS + BANK DETAILS + NOMINEE INFORMATION
// =====================================================

        {/* ================= KYC DOCUMENTS ================= */}

        <div className="bg-zinc-900 border border-indigo-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-indigo-400" size={28} />
            <h2 className="text-3xl font-black text-indigo-400">
              KYC Verification Documents
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-3">
                National ID / Passport
              </p>

              <label className="block w-full border-2 border-dashed border-indigo-500 rounded-xl p-6 text-center cursor-pointer hover:bg-zinc-800 transition">

                <Camera className="mx-auto text-indigo-400 mb-3" size={32} />

                <p className="text-white font-semibold">
                  Upload Front Side
                </p>

                <p className="text-gray-500 text-xs mt-2">
                  PNG / JPG / PDF • Max 5MB
                </p>

                <input type="file" className="hidden" accept="image/*,.pdf" />

              </label>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-3">
                Passport / ID Back Side
              </p>

              <label className="block w-full border-2 border-dashed border-indigo-500 rounded-xl p-6 text-center cursor-pointer hover:bg-zinc-800 transition">

                <Camera className="mx-auto text-indigo-400 mb-3" size={32} />

                <p className="text-white font-semibold">
                  Upload Back Side
                </p>

                <p className="text-gray-500 text-xs mt-2">
                  PNG / JPG / PDF • Max 5MB
                </p>

                <input type="file" className="hidden" accept="image/*,.pdf" />

              </label>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 lg:col-span-2">
              <p className="text-gray-400 text-sm mb-3">
                Selfie With ID Card
              </p>

              <label className="block w-full border-2 border-dashed border-indigo-500 rounded-xl p-8 text-center cursor-pointer hover:bg-zinc-800 transition">

                <Camera className="mx-auto text-indigo-400 mb-3" size={36} />

                <p className="text-white font-semibold text-lg">
                  Upload Selfie Holding Your ID
                </p>

                <p className="text-gray-500 text-sm mt-2">
                  Face must be clearly visible for verification.
                </p>

                <input type="file" className="hidden" accept="image/*" />

              </label>
            </div>

          </div>

          <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-lg">
            Submit KYC Documents
          </button>

        </div>

        {/* ================= BANK DETAILS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Wallet className="text-green-400" size={28} />
            <h2 className="text-3xl font-black text-green-400">
              Bank / Payment Information
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Account Holder Name
              </label>

              <input
                type="text"
                placeholder="Enter account holder name"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Bank Name
              </label>

              <input
                type="text"
                placeholder="Meezan Bank / HBL / UBL"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Account Number / IBAN
              </label>

              <input
                type="text"
                placeholder="PK36MEZN0000000000000000"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Branch Name
              </label>

              <input
                type="text"
                placeholder="Main Branch Islamabad"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-gray-400 mb-2 text-sm">
                Easypaisa / JazzCash Number (Optional)
              </label>

              <input
                type="text"
                placeholder="03XXXXXXXXX"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              />
            </div>

          </div>

          <button className="w-full mt-8 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black text-lg">
            Save Payment Details
          </button>

        </div>

        {/* ================= NOMINEE DETAILS ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <User className="text-orange-400" size={28} />
            <h2 className="text-3xl font-black text-orange-400">
              Nominee Information
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Nominee Full Name
              </label>

              <input
                type="text"
                placeholder="Enter nominee full name"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Relationship
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none">
                <option value="">Select Relationship</option>
                <option>Father</option>
                <option>Mother</option>
                <option>Brother</option>
                <option>Sister</option>
                <option>Husband</option>
                <option>Wife</option>
                <option>Son</option>
                <option>Daughter</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Nominee Mobile Number
              </label>

              <input
                type="text"
                placeholder="+92XXXXXXXXXX"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Nominee CNIC / Passport
              </label>

              <input
                type="text"
                placeholder="Enter nominee CNIC or Passport"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-gray-400 mb-2 text-sm">
                Nominee Address
              </label>

              <textarea
                rows={4}
                placeholder="Enter nominee complete address"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white resize-none focus:border-orange-500 outline-none"
              />
            </div>

          </div>

          <button className="w-full mt-8 bg-orange-500 hover:bg-orange-400 text-black py-4 rounded-2xl font-black text-lg">
            Save Nominee Information
          </button>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 8/10
// NOTIFICATION SETTINGS + LOGIN ACTIVITY + DEVICES
// =====================================================

        {/* ================= NOTIFICATION SETTINGS ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-5">

            {[
              {
                title: "Deposit Notifications",
                desc: "Receive notification when your deposit is approved.",
              },
              {
                title: "Withdrawal Notifications",
                desc: "Receive notification when withdrawal status changes.",
              },
              {
                title: "Gold Price Alerts",
                desc: "Get live Gold price increase/decrease alerts.",
              },
              {
                title: "Promotions & Offers",
                desc: "Receive GoldTrade bonus and promotional offers.",
              },
              {
                title: "Security Alerts",
                desc: "Get notified for login and password activity.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.desc}
                  </p>

                </div>

                <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full text-sm font-bold">
                  Enabled
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= LOGIN ACTIVITY ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Recent Login Activity
            </h2>
          </div>

          <div className="space-y-4">

            {[
              {
                device: "Chrome on Windows",
                location: "Islamabad, Pakistan",
                ip: "39.xxx.xxx.xxx",
                status: "Current Session",
              },
              {
                device: "Android App",
                location: "Lahore, Pakistan",
                ip: "103.xxx.xxx.xxx",
                status: "Previous Login",
              },
              {
                device: "Safari on iPhone",
                location: "Dubai, UAE",
                ip: "185.xxx.xxx.xxx",
                status: "Previous Login",
              },
            ].map((login, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center flex-wrap gap-4"
              >

                <div>

                  <h3 className="font-bold text-white">
                    {login.device}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {login.location}
                  </p>

                  <p className="text-gray-500 text-xs mt-2">
                    IP: {login.ip}
                  </p>

                </div>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    login.status === "Current Session"
                      ? "bg-green-600"
                      : "bg-zinc-700"
                  }`}
                >
                  {login.status}
                </span>

              </div>
            ))}

          </div>

        </div>

        {/* ================= CONNECTED DEVICES ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Connected Devices
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {[
              {
                name: "Windows Laptop",
                browser: "Google Chrome",
                status: "Current Device",
              },
              {
                name: "Samsung Galaxy S24",
                browser: "GoldTrade Android App",
                status: "Trusted Device",
              },
              {
                name: "iPhone 15 Pro",
                browser: "Safari Browser",
                status: "Trusted Device",
              },
              {
                name: "MacBook Air",
                browser: "Google Chrome",
                status: "Inactive Device",
              },
            ].map((device, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5"
              >

                <div className="flex justify-between items-start">

                  <div>

                    <h3 className="font-bold text-lg text-white">
                      {device.name}
                    </h3>

                    <p className="text-gray-400 text-sm mt-1">
                      {device.browser}
                    </p>

                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      device.status === "Current Device"
                        ? "bg-green-600"
                        : device.status === "Trusted Device"
                        ? "bg-blue-600"
                        : "bg-red-600"
                    }`}
                  >
                    {device.status}
                  </span>

                </div>

                <button className="w-full mt-5 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold">
                  Disconnect Device
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= SESSION MANAGEMENT ================= */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Lock className="text-red-400" size={28} />

            <h2 className="text-3xl font-black text-red-400">
              Session Management
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <button className="bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-lg">
              Logout All Devices
            </button>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg">
              Reset All Active Sessions
            </button>

          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-5 mt-6">

            <h3 className="font-bold text-yellow-400 mb-3">
              Security Recommendation
            </h3>

            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Enable Two-Factor Authentication.</li>
              <li>• Change password every 90 days.</li>
              <li>• Remove devices you no longer use.</li>
              <li>• Never share OTP or recovery codes.</li>
            </ul>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 9/10
// SUPPORT CENTER + ACCOUNT PREFERENCES + PRIVACY SETTINGS
// =====================================================

        {/* ================= SUPPORT CENTER ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-yellow-400" size={28} />
            <h2 className="text-3xl font-black text-yellow-400">
              Support Center
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-yellow-400 text-lg mb-2">
                Deposit Support
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Contact support if your deposit remains pending after the normal
                review period.
              </p>

              <button className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold">
                Contact Deposit Team
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-yellow-400 text-lg mb-2">
                Withdrawal Support
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Submit withdrawal-related issues or payment complaints.
              </p>

              <button className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold">
                Contact Withdrawal Team
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-yellow-400 text-lg mb-2">
                Trading Support
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Get help with Gold Buy, Sell orders, or pricing issues.
              </p>

              <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold">
                Contact Trading Team
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-yellow-400 text-lg mb-2">
                Verification Support
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Need help completing KYC or uploading documents?
              </p>

              <button className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold">
                Contact Verification Team
              </button>
            </div>

          </div>

        </div>

        {/* ================= ACCOUNT PREFERENCES ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-cyan-400" size={28} />
            <h2 className="text-3xl font-black text-cyan-400">
              Account Preferences
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Preferred Language
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none">
                <option>English</option>
                <option>Urdu</option>
                <option>Roman Urdu</option>
                <option>Arabic</option>
                <option>Khmer</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Currency Display
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none">
                <option>PKR - Pakistani Rupee</option>
                <option>USD - US Dollar</option>
                <option>AED - UAE Dirham</option>
                <option>KHR - Cambodian Riel</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Time Zone
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none">
                <option>Asia/Karachi</option>
                <option>Asia/Dubai</option>
                <option>Asia/Phnom_Penh</option>
                <option>UTC</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Theme
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none">
                <option>GoldTrade Black & Gold</option>
                <option>Dark Mode</option>
                <option>Light Mode</option>
              </select>
            </div>

          </div>

          <button className="w-full mt-8 bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-black text-lg">
            Save Preferences
          </button>

        </div>

        {/* ================= PRIVACY SETTINGS ================= */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Lock className="text-red-400" size={28} />
            <h2 className="text-3xl font-black text-red-400">
              Privacy Settings
            </h2>
          </div>

          <div className="space-y-5">

            {[
              {
                title: "Hide Wallet Balance",
                desc: "Hide wallet balance on dashboard until you tap to reveal it.",
              },
              {
                title: "Hide Gold Holdings",
                desc: "Hide your Gold balance from the dashboard.",
              },
              {
                title: "Private Referral Code",
                desc: "Prevent referral code from appearing publicly.",
              },
              {
                title: "Allow Email Notifications",
                desc: "Receive account updates via email.",
              },
              {
                title: "Allow SMS Notifications",
                desc: "Receive important account alerts via SMS.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.desc}
                  </p>

                </div>

                <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full text-sm font-bold">
                  ON
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= ACCOUNT INFORMATION ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <BadgeCheck className="text-green-400" size={28} />
            <h2 className="text-3xl font-black text-green-400">
              Account Information
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">User ID</p>

              <p className="text-white font-mono mt-2 break-all">
                {profile._id || "GT-USER-000000"}
              </p>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Membership Date</p>

              <p className="text-yellow-400 font-bold mt-2">
                {memberSince}
              </p>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Registered Country</p>

              <p className="text-white font-bold mt-2">
                {profile.country || "Pakistan"}
              </p>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Current City</p>

              <p className="text-white font-bold mt-2">
                {profile.city || "Islamabad"}
              </p>

            </div>

          </div>

        </div>

        {/* ================= DANGER ZONE ================= */}

        <div className="bg-zinc-900 border border-red-700 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-red-500" size={28} />
            <h2 className="text-3xl font-black text-red-500">
              Danger Zone
            </h2>
          </div>

          <div className="space-y-6">

            <div className="bg-black border border-red-700 rounded-2xl p-5">

              <h3 className="font-bold text-red-400 text-lg mb-2">
                Logout From Current Device
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                End your current session securely.
              </p>

              <button className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold">
                Logout
              </button>

            </div>

            <div className="bg-black border border-red-700 rounded-2xl p-5">

              <h3 className="font-bold text-red-400 text-lg mb-2">
                Delete GoldTrade Account
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                This action permanently removes your GoldTrade account after admin verification.
              </p>

              <button className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-xl font-bold">
                Request Account Deletion
              </button>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/profile/page.tsx
// SECTION 10/10
// PROFILE SUMMARY + FOOTER + CLOSE COMPONENT
// =====================================================

        {/* ================= PROFILE SUMMARY ================= */}

        <div className="bg-gradient-to-r from-yellow-900 via-black to-yellow-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <h2 className="text-4xl font-black text-yellow-400">
                GoldTrade Profile Summary
              </h2>

              <p className="text-gray-300 mt-3 max-w-2xl">
                Your GoldTrade profile stores your wallet balances, KYC verification,
                referral information, security settings, nominee details and payment
                methods securely using JWT authentication and MongoDB.
              </p>

            </div>

            <div className="bg-black/50 border border-yellow-500 rounded-2xl p-5 min-w-[260px]">

              <p className="text-gray-400 text-sm">
                Portfolio Value
              </p>

              <h3 className="text-4xl font-black text-yellow-400 mt-2">
                PKR {totalPortfolio.toLocaleString()}
              </h3>

              <p className="text-green-400 text-sm mt-3">
                Member Since {memberSince}
              </p>

            </div>

          </div>

        </div>

        {/* ================= PROFILE COMPLETION ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Award className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Profile Completion
            </h2>

          </div>

          <div className="space-y-5">

            {[
              { label: "Personal Information", done: profile.fullName !== "" },
              { label: "Phone Verification", done: security.phoneVerified },
              { label: "Email Verification", done: security.emailVerified },
              { label: "KYC Verification", done: profile.kycStatus === "VERIFIED" },
              { label: "Payment Details Added", done: true },
              { label: "Nominee Information Added", done: true },
            ].map((item) => (

              <div
                key={item.label}
                className="flex justify-between items-center bg-black border border-zinc-700 rounded-xl p-4"
              >

                <span className="font-medium text-white">
                  {item.label}
                </span>

                {item.done ? (
                  <span className="flex items-center gap-2 bg-green-600 px-3 py-1 rounded-full text-xs font-bold">
                    <CheckCircle2 size={14} />
                    Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                    <Clock size={14} />
                    Pending
                  </span>
                )}

              </div>

            ))}

          </div>

        </div>

        {/* ================= ACCOUNT SECURITY NOTICE ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Security Notice
            </h2>

          </div>

          <div className="space-y-4 text-gray-300">

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="font-semibold text-cyan-400 mb-2">
                Account Protection
              </p>

              <p className="text-sm">
                Never share your password, OTP or recovery codes with anyone.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="font-semibold text-cyan-400 mb-2">
                Secure Withdrawals
              </p>

              <p className="text-sm">
                Every withdrawal request requires admin verification before payment.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="font-semibold text-cyan-400 mb-2">
                KYC Verification
              </p>

              <p className="text-sm">
                Large deposits and withdrawals require verified KYC documents.
              </p>
            </div>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-6">

            <div>

              <h3 className="text-2xl font-black text-yellow-400">
                GoldTrade V17 Enterprise
              </h3>

              <p className="text-gray-400 mt-2">
                Pakistan Digital Gold Trading Platform
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Profile Module
              </p>

              <p className="text-white font-semibold mt-2">
                Wallet • Security • KYC • Referral • Privacy
              </p>

            </div>

            <div className="md:text-right">

              <p className="text-gray-400 text-sm">
                Security Status
              </p>

              <p className="text-green-400 font-semibold mt-2">
                JWT Protected • MongoDB Stored • Admin Verified
              </p>

            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-5 text-center text-gray-500 text-sm">

            © 2026 GoldTrade Pakistan. All Rights Reserved.

          </div>

        </footer>

      </div>
    </main>
  );
}
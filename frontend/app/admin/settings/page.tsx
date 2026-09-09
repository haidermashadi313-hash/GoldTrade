"use client";

import { useEffect, useState } from "react";
import {
  Save,
  RefreshCw,
  Wallet,
  Coins,
  DollarSign,
  ShieldCheck,
  Upload,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

const API = "http://localhost:5000";

interface SettingsData {
  goldPriceUSD: number;
  usdToPkr: number;
  usdtRate: number;
  goldSpread: number;
  trc20Wallet: string;
  trc20Qr: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    goldPriceUSD: 3420.5,
    usdToPkr: 282.4,
    usdtRate: 282.4,
    goldSpread: 2,
    trc20Wallet: "",
    trc20Qr: "",
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  // ----------------------------
  // Load Settings
  // ----------------------------
  const loadSettings = async () => {
    try {
      setRefreshing(true);

      const res = await fetch(`${API}/api/settings`);
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);

        if (data.data.trc20Qr) {
          setPreview(`${API}/uploads/settings/${data.data.trc20Qr}`);
        }
      }
    } catch (err) {
      console.log(err);
      alert("Unable to load settings.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // ----------------------------
  // Save Settings
  // ----------------------------
  const saveSettings = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "goldPriceUSD",
        settings.goldPriceUSD.toString()
      );
      formData.append("usdToPkr", settings.usdToPkr.toString());
      formData.append("usdtRate", settings.usdtRate.toString());
      formData.append(
        "goldSpread",
        settings.goldSpread.toString()
      );
      formData.append("trc20Wallet", settings.trc20Wallet);

      if (qrFile) {
        formData.append("qr", qrFile);
      }

      const res = await fetch(`${API}/api/settings`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        alert("GoldTrade Settings Updated Successfully.");
        loadSettings();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-yellow-400 flex items-center gap-3">
            <ShieldCheck size={34}/>
            GoldTrade Settings
          </h1>

          <p className="text-gray-400 mt-2">
            Finance Manager • Live Market • Wallet Configuration
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={refreshing}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>

      </div>

      {/* Live Preview Cards */}
      <div className="grid md:grid-cols-4 gap-5 mb-8">

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-3xl p-5 text-black">
          <Coins size={28}/>
          <p className="mt-2 text-sm font-semibold">
            Gold Price
          </p>

          <h2 className="text-2xl font-bold">
            ${settings.goldPriceUSD}
          </h2>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-3xl p-5 text-black">
          <DollarSign size={28}/>
          <p className="mt-2 text-sm font-semibold">
            USDT Rate
          </p>

          <h2 className="text-2xl font-bold">
            PKR {settings.usdtRate}
          </h2>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-3xl p-5 text-black">
          <TrendingUp size={28}/>
          <p className="mt-2 text-sm font-semibold">
            USD → PKR
          </p>

          <h2 className="text-2xl font-bold">
            {settings.usdToPkr}
          </h2>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-3xl p-5 text-white">
          <Wallet size={28}/>
          <p className="mt-2 text-sm font-semibold">
            Gold Spread
          </p>

          <h2 className="text-2xl font-bold">
            {settings.goldSpread}%
          </h2>
        </div>

      </div>

      {/* Settings Form */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 space-y-8">

        <h2 className="text-2xl font-bold text-yellow-400">
          Live Market Configuration
        </h2>

        {/* Gold Price */}
        <div>
          <label className="text-gray-400">
            Live Gold Price (USD)
          </label>

          <input
            type="number"
            value={settings.goldPriceUSD}
            onChange={(e) =>
              setSettings({
                ...settings,
                goldPriceUSD: Number(e.target.value),
              })
            }
            className="w-full bg-black border border-yellow-500 rounded-xl p-3 mt-2"
          />
        </div>

        {/* USD PKR */}
        <div>
          <label className="text-gray-400">
            USD → PKR Exchange Rate
          </label>

          <input
            type="number"
            value={settings.usdToPkr}
            onChange={(e) =>
              setSettings({
                ...settings,
                usdToPkr: Number(e.target.value),
              })
            }
            className="w-full bg-black border border-blue-500 rounded-xl p-3 mt-2"
          />
        </div>

        {/* USDT */}
        <div>
          <label className="text-gray-400">
            TRC20 USDT Rate (PKR)
          </label>

          <input
            type="number"
            value={settings.usdtRate}
            onChange={(e) =>
              setSettings({
                ...settings,
                usdtRate: Number(e.target.value),
              })
            }
            className="w-full bg-black border border-green-500 rounded-xl p-3 mt-2"
          />
        </div>

        {/* Spread */}
        <div>
          <label className="text-gray-400">
            Gold Trading Spread (%)
          </label>

          <input
            type="number"
            value={settings.goldSpread}
            onChange={(e) =>
              setSettings({
                ...settings,
                goldSpread: Number(e.target.value),
              })
            }
            className="w-full bg-black border border-purple-500 rounded-xl p-3 mt-2"
          />

          <p className="text-xs text-gray-500 mt-2">
            Example: 2% means GoldTrade adds 2% trading spread.
          </p>
        </div>

        {/* Wallet */}
        <div>
          <label className="text-gray-400">
            Official GoldTrade TRC20 Wallet Address
          </label>

          <textarea
            rows={4}
            value={settings.trc20Wallet}
            onChange={(e) =>
              setSettings({
                ...settings,
                trc20Wallet: e.target.value,
              })
            }
            className="w-full bg-black border border-cyan-500 rounded-xl p-3 mt-2"
            placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />

          <p className="text-xs text-gray-500 mt-2">
            This wallet is shown on Deposit & Buy USDT pages.
          </p>
        </div>

        {/* QR Upload */}
        <div>

          <label className="text-gray-400 mb-3 block">
            TRC20 Wallet QR Code
          </label>

          <div className="border-2 border-dashed border-yellow-500 rounded-2xl p-6 text-center">

            <Upload className="mx-auto text-yellow-400 mb-3" size={36}/>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                setQrFile(file);
                setPreview(URL.createObjectURL(file));
              }}
            />

            <p className="text-gray-500 text-sm mt-3">
              Upload TRC20 QR Code (PNG / JPG)
            </p>

          </div>

          {preview && (
            <div className="mt-5">
              <p className="text-green-400 mb-2">
                QR Preview
              </p>

              <img
                src={preview}
                alt="TRC20 QR"
                className="w-48 h-48 rounded-2xl border border-yellow-500 object-cover"
              />
            </div>
          )}

        </div>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl text-lg font-bold flex justify-center items-center gap-3"
        >
          <Save size={22}/>

          {loading
            ? "Saving Settings..."
            : "Save GoldTrade Settings"}
        </button>

        {saved && (
          <div className="bg-green-600 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={24}/>
            Settings saved successfully.
          </div>
        )}

      </div>

      {/* Live Preview */}
      <div className="mt-10 bg-zinc-900 border border-green-500 rounded-3xl p-8">

        <h2 className="text-2xl font-bold text-green-400 mb-5">
          Live User Dashboard Preview
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <div className="bg-black border border-yellow-500 rounded-2xl p-5">
            <p className="text-gray-400">
              Live Gold Price
            </p>

            <h2 className="text-4xl font-bold text-yellow-400">
              ${settings.goldPriceUSD}
            </h2>
          </div>

          <div className="bg-black border border-green-500 rounded-2xl p-5">
            <p className="text-gray-400">
              TRC20 USDT Rate
            </p>

            <h2 className="text-4xl font-bold text-green-400">
              PKR {settings.usdtRate}
            </h2>
          </div>

          <div className="bg-black border border-blue-500 rounded-2xl p-5">
            <p className="text-gray-400">
              USD → PKR
            </p>

            <h2 className="text-4xl font-bold text-blue-400">
              {settings.usdToPkr}
            </h2>
          </div>

          <div className="bg-black border border-cyan-500 rounded-2xl p-5">
            <p className="text-gray-400">
              TRC20 Wallet
            </p>

            <p className="text-cyan-400 break-all mt-3 text-sm">
              {settings.trc20Wallet || "Wallet address not added."}
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}
"use client";

import { useState } from "react";

type PaymentSettings = {
  bank: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    qrCode?: string;
  };
  easyPaisa: {
    accountTitle: string;
    mobileNumber: string;
    qrCode?: string;
  };
  nayaPay: {
    accountTitle: string;
    mobileNumber: string;
    qrCode?: string;
  };
  usdtWallet: {
    network: string;
    walletAddress: string;
    qrCode?: string;
  };
};

type PaymentMethod = "BANK" | "EASYPAISA" | "NAYAPAY" | "USDT";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function BuyUsdtPage() {
  const [paymentSettings] = useState<PaymentSettings | null>(null);
  const [selectedMethod] = useState<PaymentMethod>("BANK");

  return (
    paymentSettings && (
  <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

    {/* BANK */}

    {selectedMethod === "BANK" && (
      <>
        <h2 className="text-2xl font-black text-green-400 mb-4">
          {paymentSettings.bank.bankName}
        </h2>

        <div className="space-y-3">
          <p><span className="text-gray-400">Account Title:</span> {paymentSettings.bank.accountTitle}</p>
          <p><span className="text-gray-400">Account Number:</span> {paymentSettings.bank.accountNumber}</p>
          <p><span className="text-gray-400">IBAN:</span> {paymentSettings.bank.iban}</p>
        </div>

        {paymentSettings.bank.qrCode && (
          <img
            src={`${API}${paymentSettings.bank.qrCode}`}
            alt="Bank QR"
            className="mt-6 w-52 rounded-2xl border border-green-500"
          />
        )}
      </>
    )}

    {/* EASYPAISA */}

    {selectedMethod === "EASYPAISA" && (
      <>
        <h2 className="text-2xl font-black text-purple-400 mb-4">
          EasyPaisa
        </h2>

        <div className="space-y-3">
          <p><span className="text-gray-400">Account Title:</span> {paymentSettings.easyPaisa.accountTitle}</p>
          <p><span className="text-gray-400">Mobile Number:</span> {paymentSettings.easyPaisa.mobileNumber}</p>
        </div>

        {paymentSettings.easyPaisa.qrCode && (
          <img
            src={`${API}${paymentSettings.easyPaisa.qrCode}`}
            alt="EasyPaisa QR"
            className="mt-6 w-52 rounded-2xl border border-purple-500"
          />
        )}
      </>
    )}

    {/* NAYAPAY */}

    {selectedMethod === "NAYAPAY" && (
      <>
        <h2 className="text-2xl font-black text-cyan-400 mb-4">
          NayaPay
        </h2>

        <div className="space-y-3">
          <p><span className="text-gray-400">Account Title:</span> {paymentSettings.nayaPay.accountTitle}</p>
          <p><span className="text-gray-400">Mobile Number:</span> {paymentSettings.nayaPay.mobileNumber}</p>
        </div>

        {paymentSettings.nayaPay.qrCode && (
          <img
            src={`${API}${paymentSettings.nayaPay.qrCode}`}
            alt="NayaPay QR"
            className="mt-6 w-52 rounded-2xl border border-cyan-500"
          />
        )}
      </>
    )}

    {/* USDT TRC20 */}

    {selectedMethod === "USDT" && (
      <>
        <h2 className="text-2xl font-black text-yellow-400 mb-4">
          USDT Wallet ({paymentSettings.usdtWallet.network})
        </h2>

        <div className="space-y-3">
          <p className="break-all">
            <span className="text-gray-400">Wallet Address:</span>{" "}
            {paymentSettings.usdtWallet.walletAddress}
          </p>
        </div>

        {paymentSettings.usdtWallet.qrCode && (
          <img
            src={`${API}${paymentSettings.usdtWallet.qrCode}`}
            alt="USDT QR"
            className="mt-6 w-52 rounded-2xl border border-yellow-500"
          />
        )}
      </>
    )}

  </div>
    )
  );
}
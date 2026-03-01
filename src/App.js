import React, { useState, useMemo, useEffect } from "react";
import {
  Home,
  ShoppingCart,
  User,
  Plus,
  Minus,
  Trash2,
  Store,
  MapPin,
  CreditCard,
  CheckCircle2,
  Package,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

// --- MASUKKAN URL GOOGLE APPS SCRIPT ANDA DI SINI ---
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyQpGJwQUr4k73E27MB3h0xQU3GmVn-Cvc8uebxU1-5UgKpcHF0ZFxBcHURyn_JG174/exec";

// --- DATA BARANG CADANGAN (Muncul jika URL Google Script kosong atau gagal dimuat) ---
const INITIAL_OFFERS = [
  {
    id: "p1",
    name: "Beras Premium 5kg",
    price: 65000,
    seller: "Warung Bu Siti",
    category: "Sembako",
    phone: "6281234567890",
    timePosted: "Baru saja",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=400&h=400",
  },
  {
    id: "p2",
    name: "Jasa Servis & Cuci AC",
    price: 75000,
    seller: "Budi Teknik",
    category: "Jasa",
    phone: "6281234567891",
    timePosted: "1 jam lalu",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400&h=400",
  },
  {
    id: "p4",
    name: "Keripik Pisang Coklat (PO)",
    price: 15000,
    seller: "Dapur Neng Lita",
    category: "Makanan",
    phone: "6281234567893",
    timePosted: "2 jam lalu",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=400",
  },
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [cart, setCart] = useState([]);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [checkoutData, setCheckoutData] = useState({
    name: "",
    paymentMethod: "cod",
    deliveryMethod: "seller",
  });

  // Mengambil data dari Google Sheets
  useEffect(() => {
    const fetchProducts = async () => {
      if (!GOOGLE_SCRIPT_URL) {
        setOffers(INITIAL_OFFERS);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();
        if (data && data.length > 0) {
          setOffers(data);
        } else {
          setOffers(INITIAL_OFFERS);
        }
      } catch (error) {
        console.error("Gagal memuat data dari Sheet:", error);
        setOffers(INITIAL_OFFERS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // --- LOGIC KERANJANG ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = useMemo(
    () =>
      cart.reduce((total, item) => total + item.product.price * item.qty, 0),
    [cart]
  );
  const totalItemsInCart = useMemo(
    () => cart.reduce((total, item) => total + item.qty, 0),
    [cart]
  );

  // --- LOGIC CHECKOUT KE WHATSAPP & GOOGLE SHEETS ---
  const handleCheckoutSubmit = async () => {
    if (!checkoutData.name.trim()) {
      alert("Mohon isi nama Anda terlebih dahulu!");
      return;
    }

    const orderDetails = cart
      .map(
        (item) =>
          `- ${item.qty}x ${item.product.name} (${formatRupiah(
            item.product.price * item.qty
          )})`
      )
      .join("\n");
    const waOrderDetails = cart
      .map(
        (item) =>
          `- ${item.qty}x ${item.product.name} (${formatRupiah(
            item.product.price * item.qty
          )})`
      )
      .join("%0A");

    // Menyimpan rekap pesanan ke Google Sheets (jika URL tersedia)
    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors", // Penting agar tidak terblokir masalah CORS dari Google
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: checkoutData.name,
            items: orderDetails,
            total: cartTotal,
            paymentMethod:
              checkoutData.paymentMethod === "cod" ? "COD" : "Saldo Kas",
            deliveryMethod:
              checkoutData.deliveryMethod === "seller"
                ? "Diantar Penjual"
                : "Kurir",
          }),
        });
      } catch (error) {
        console.error("Gagal mencatat pesanan ke Sheet:", error);
      }
    }

    // Mengarahkan ke WhatsApp untuk konfirmasi langsung
    const textPesan = `Halo, saya *${
      checkoutData.name
    }* dari Forum Niaga Keluarga.%0A%0ASaya ingin memesan:%0A${waOrderDetails}%0A%0A*Total Bayar: ${formatRupiah(
      cartTotal
    )}*%0AMetode Bayar: ${
      checkoutData.paymentMethod === "cod"
        ? "Bayar di Tempat (COD)"
        : "Potong Saldo Kas"
    }%0APengiriman: ${
      checkoutData.deliveryMethod === "seller"
        ? "Diantar Penjual"
        : "Kurir Warga"
    }%0A%0AMohon konfirmasinya ya! Terima kasih.`;

    // Anda bisa mengganti ini dengan nomor WA koodinator/admin pusat jika perlu
    const nomorAdmin = "6281234567890";
    window.open(`https://wa.me/${nomorAdmin}?text=${textPesan}`, "_blank");

    setCart([]);
    setCheckoutStep("success");
  };

  // --- LOADING SCREEN ---
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-emerald-50 text-emerald-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <h2 className="font-bold text-lg">Mengambil Data...</h2>
        <p className="text-sm opacity-70">Menghubungkan ke Google Sheets</p>
      </div>
    );
  }

  // --- KOMPONEN HALAMAN ---
  const renderHome = () => (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="bg-emerald-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Store className="w-6 h-6" /> Pasar Keluarga
        </h1>
        <p className="text-emerald-100 text-sm mt-1">
          Simulasi Jual Beli Khusus Keluarga
        </p>
      </div>

      <div className="p-4 space-y-4">
        {offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Belum ada barang di database.</p>
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-3"
            >
              <img
                src={
                  offer.image ||
                  "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400"
                }
                alt={offer.name}
                className="w-24 h-24 object-cover rounded-lg border border-gray-100 bg-gray-50"
              />

              <div className="flex flex-col flex-1">
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded w-max mb-1">
                  {offer.category || "Umum"}
                </span>
                <h4 className="text-sm font-medium text-gray-800 leading-snug">
                  {offer.name}
                </h4>
                <p className="text-emerald-600 font-bold text-sm mt-1">
                  {formatRupiah(offer.price)}
                </p>

                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <User className="w-3 h-3" /> {offer.seller}
                </div>

                <button
                  onClick={() => addToCart(offer)}
                  className="mt-auto bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Keranjang
                </button>
              </div>
            </div>
          ))
        )}

        <div className="text-center pt-8 pb-4 opacity-50">
          <p className="text-xs font-medium text-gray-500">
            Aplikasi Pasar Keluarga v1.0
          </p>
          <p className="text-[10px] text-gray-400">Server Mandiri Aktif</p>
        </div>
      </div>
    </div>
  );

  const renderCart = () => {
    if (checkoutStep === "success") {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20 px-6 text-center">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pesan WA Dibuat!
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Pesanan Anda telah dicatat dan diarahkan ke WhatsApp untuk
            dikirimkan ke Penjual/Admin.
          </p>
          <button
            onClick={() => {
              setCheckoutStep("cart");
              setActiveTab("home");
            }}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mb-3"
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }

    if (checkoutStep === "payment") {
      return (
        <div className="pb-24 bg-gray-50 min-h-screen">
          <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
            <button
              onClick={() => setCheckoutStep("cart")}
              className="text-gray-500"
            >
              ← Kembali
            </button>
            <h1 className="text-lg font-bold">Checkout via WA</h1>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">
                Nama Pemesan
              </h3>
              <input
                type="text"
                placeholder="Contoh: Bude Ani"
                value={checkoutData.name}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Pengiriman
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="seller"
                    checked={checkoutData.deliveryMethod === "seller"}
                    onChange={(e) =>
                      setCheckoutData({
                        ...checkoutData,
                        deliveryMethod: e.target.value,
                      })
                    }
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">Diantar Penjual</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="kurir"
                    checked={checkoutData.deliveryMethod === "kurir"}
                    onChange={(e) =>
                      setCheckoutData({
                        ...checkoutData,
                        deliveryMethod: e.target.value,
                      })
                    }
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">Kurir Warga / Ojek Lokal</span>
                </label>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Pembayaran
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={checkoutData.paymentMethod === "cod"}
                    onChange={(e) =>
                      setCheckoutData({
                        ...checkoutData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">Bayar Tunai (COD)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="kas"
                    checked={checkoutData.paymentMethod === "kas"}
                    onChange={(e) =>
                      setCheckoutData({
                        ...checkoutData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="accent-emerald-600"
                  />
                  <span className="text-sm">Potong Saldo Kas</span>
                </label>
              </div>
            </div>
          </div>

          <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white p-4 border-t border-gray-200 z-20">
            <button
              onClick={handleCheckoutSubmit}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all"
            >
              <MessageCircle className="w-5 h-5" /> Kirim Pesanan via WhatsApp
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pb-32 bg-gray-50 min-h-screen">
        <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-gray-800">Keranjang Belanja</h1>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
            <p>Keranjang masih kosong.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg bg-gray-50"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium line-clamp-1">
                    {item.product.name}
                  </h3>
                  <p className="text-emerald-600 font-bold text-sm">
                    {formatRupiah(item.product.price)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg border">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="text-gray-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="text-gray-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div>
              <p className="text-xs text-gray-500">Total Belanja</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatRupiah(cartTotal)}
              </p>
            </div>
            <button
              onClick={() => setCheckoutStep("payment")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
            >
              Lanjut ({totalItemsInCart})
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden font-sans text-gray-800">
      <div className="h-screen overflow-y-auto">
        {activeTab === "home" && renderHome()}
        {activeTab === "cart" && renderCart()}
      </div>

      {(activeTab !== "cart" || checkoutStep === "cart") && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-50">
          <button
            onClick={() => {
              setActiveTab("home");
              setCheckoutStep("cart");
            }}
            className={`flex flex-col items-center gap-1 w-16 ${
              activeTab === "home" ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab("cart")}
            className={`flex flex-col items-center gap-1 w-16 relative ${
              activeTab === "cart" ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {totalItemsInCart > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsInCart}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Keranjang</span>
          </button>
        </div>
      )}
    </div>
  );
}

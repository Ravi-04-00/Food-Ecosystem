import React, { useState } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Share2, 
  ArrowLeft, 
  Check, 
  Truck, 
  Clock, 
  HelpCircle,
  Tag,
  RotateCcw,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { INITIAL_PRODUCTS } from '../services/mockData.js';

export const ProductDetails = ({
  product,
  onBack,
  onBuyNow,
  onSelectProduct,
}) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || null);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [copiedShare, setCopiedShare] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState([
    { q: 'Is international delivery insured by WSHOP Escrow?', a: 'Yes. All shipments include 100% full transit insurance and tamper-evident packaging.' },
    { q: 'Does this come with official manufacturer warranty and invoice?', a: 'Yes. Comes with original brand warranty and GST tax invoice registered to your account.' },
  ]);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);
  const galleryImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  // Related products lookup
  const relatedProducts = (product.relatedIds || [])
    .map((id) => INITIAL_PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setQuestions([...questions, { q: newQuestion, a: 'WSHOP atelier curator has received your inquiry and will respond within 2 hours.' }]);
    setNewQuestion('');
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-fadeIn text-[#F5F5F5]">
      
      {/* Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs uppercase font-sans tracking-luxury font-semibold text-[#A7A7AE] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#D6A85F]" />
          <span>Back to Marketplace</span>
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-[#A7A7AE] font-mono">
          <span>Home</span>
          <ChevronRight className="w-3 h-3 text-[#D6A85F]" />
          <span className="uppercase">{product.category}</span>
          <ChevronRight className="w-3 h-3 text-[#D6A85F]" />
          <span className="text-[#F5F5F5] font-semibold truncate max-w-[200px]">{product.brand || product.name}</span>
        </div>
      </div>

      {/* Main 2-Column Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column (6 Cols): Multi-image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Main Display Image */}
          <div className="relative rounded-3xl overflow-hidden bg-[#0B0B0D] border border-white/10 shadow-2xl group">
            <img
              src={galleryImages[selectedImage] || product.image}
              alt={product.name}
              className="w-full h-[460px] sm:h-[540px] object-cover transition-transform duration-700"
            />
            
            {/* Top Left Badges */}
            <div className="absolute top-5 left-5 flex flex-col gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-[#050505]/90 text-[#D6A85F] text-[10px] font-mono tracking-widest uppercase border border-[#D6A85F]/40 backdrop-blur-md">
                {product.availability || (product.stock > 0 ? 'In Stock' : 'Out of Stock')}
              </span>
              {product.discount && (
                <span className="px-3 py-1 rounded-full bg-[#D6A85F] text-[#050505] text-[10px] font-mono font-bold tracking-wider shadow-sm">
                  {product.discount}
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-5 right-5 p-3 rounded-full border backdrop-blur-md transition-all ${
                isFavorited
                  ? 'bg-[#050505] text-[#D6A85F] border-[#D6A85F]'
                  : 'bg-[#1C1C21]/80 hover:bg-[#1C1C21] text-[#A7A7AE] border-white/10'
              }`}
              title="Save to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-[#D6A85F]' : ''}`} />
            </button>
          </div>

          {/* Clickable Image Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all bg-[#0B0B0D] ${
                    selectedImage === idx
                      ? 'border-[#D6A85F] ring-2 ring-[#D6A85F]/40 scale-102'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#A7A7AE] font-mono px-2 pt-2">
            <span>STUDIO PHOTOGRAPHY · {galleryImages.length} VIEWS</span>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 text-[#F5F5F5] hover:text-[#D6A85F] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'LINK COPIED' : 'SHARE PRODUCT'}</span>
            </button>
          </div>
        </div>

        {/* Right Column (6 Cols): Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-7">
          
          <div>
            {/* Brand + SubCategory + Seller Info */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono tracking-widest font-bold text-[#D6A85F]">
                {product.brand || 'ATELIER BRAND'}
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-[#A7A7AE]">
                <span>Sold by {product.seller}</span>
                {product.sellerVerified && <ShieldCheck className="w-3.5 h-3.5 text-[#D6A85F]" title="Verified Seller" />}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C1C21] border border-white/10 text-[#F5F5F5] font-bold">
                  ★ {product.sellerRating || '4.9'}
                </span>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F5F5] leading-tight">
              {product.name}
            </h1>

            {/* Customer Rating & Reviews */}
            <div className="flex items-center space-x-3 mt-3">
              <div className="flex text-[#D6A85F]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D6A85F]" />
                ))}
              </div>
              <span className="text-xs font-bold text-[#F5F5F5]">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-[#A7A7AE]">({product.reviewCount} Verified Ratings)</span>
              <span className="text-[11px] font-mono text-[#D6A85F] bg-[#151519] px-2 py-0.5 rounded border border-[#D6A85F]/30 font-semibold">
                WS CERTIFIED
              </span>
            </div>
          </div>

          {/* Price & Discount Box */}
          <div className="p-6 rounded-2xl bg-[#151519] border border-white/10 shadow-lg flex items-baseline justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] block">
                SPECIAL PRICE
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F5F5]">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-[#A7A7AE] line-through font-sans">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.discount && (
                  <span className="text-xs font-mono font-bold text-[#050505] bg-[#D6A85F] px-2.5 py-1 rounded-full">
                    {product.discount}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-[#D6A85F] font-bold block">
                ESCROW PROTECTED
              </span>
              <span className="text-xs text-[#A7A7AE] font-sans">
                {product.deliveryInfo || 'Free Express Delivery'}
              </span>
            </div>
          </div>

          {/* Color Variants Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Color: <span className="font-normal text-[#A7A7AE]">{selectedColor}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${
                      selectedColor === c.name
                        ? 'border-[#D6A85F] bg-[#1C1C21] ring-2 ring-[#D6A85F]/40 shadow-xs'
                        : 'border-white/10 bg-[#151519] hover:border-white/30'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                      style={{ backgroundColor: c.hex }} 
                    />
                    <span className="text-xs font-medium text-[#F5F5F5]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size / Storage Variants Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Configuration / Size: <span className="font-normal text-[#A7A7AE]">{selectedSize}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono uppercase font-semibold border transition-all ${
                      selectedSize === s
                        ? 'bg-[#D6A85F] text-[#050505] border-[#D6A85F] shadow-sm'
                        : 'bg-[#151519] text-[#F5F5F5] border-white/10 hover:border-[#D6A85F]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Short Description */}
          <p className="text-sm sm:text-base text-[#A7A7AE] font-sans leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          {/* Bank Offers / Discounts Box */}
          {product.offers && product.offers.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#1C1C21] border border-[#D6A85F]/30 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#D6A85F] uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-[#D6A85F]" />
                <span>Available Bank Offers & Discounts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#A7A7AE] font-sans">
                {product.offers.map((offer, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <Check className="w-3.5 h-3.5 text-[#D6A85F] mt-0.5 shrink-0" />
                    <span>{offer}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery & Return Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 border-y border-white/10 text-xs">
            <div className="flex items-center space-x-2 text-[#A7A7AE]">
              <Truck className="w-4 h-4 text-[#D6A85F] shrink-0" />
              <span>{product.deliveryInfo || 'Free Express Delivery'}</span>
            </div>
            <div className="flex items-center space-x-2 text-[#A7A7AE]">
              <RotateCcw className="w-4 h-4 text-[#D6A85F] shrink-0" />
              <span>{product.returnPolicy || '7-Day Replacement Policy'}</span>
            </div>
            <div className="flex items-center space-x-2 text-[#A7A7AE]">
              <Shield className="w-4 h-4 text-[#D6A85F] shrink-0" />
              <span>{product.warranty || '1 Year Official Warranty'}</span>
            </div>
          </div>

          {/* Quantity Selector & Action Buttons: Add to Cart, Buy Now, Wishlist */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              <span className="text-xs uppercase font-sans tracking-luxury font-bold text-[#F5F5F5]">
                QUANTITY:
              </span>
              <div className="flex items-center border border-white/15 rounded-full bg-[#1C1C21] px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#F5F5F5] hover:bg-[#25252D]"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-sm font-bold text-[#F5F5F5]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#F5F5F5] hover:bg-[#25252D]"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-[#A7A7AE] font-mono">
                {product.stock || 12} units available in stock
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <button
                type="button"
                onClick={() => addToCart(product, quantity)}
                className="flex-1 py-4 rounded-full bg-[#D6A85F] text-[#050505] hover:bg-[#F0C982] text-xs font-sans uppercase tracking-luxury font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-[#050505]" />
                <span>ADD TO CART ({quantity})</span>
              </button>

              <button
                type="button"
                onClick={() => onBuyNow(product, quantity)}
                className="flex-1 physical-btn py-4 rounded-full bg-[#F5F5F5] text-[#050505] hover:bg-white text-xs font-sans uppercase tracking-luxury font-bold transition-all flex items-center justify-center space-x-2 shadow-xl"
              >
                <span>BUY NOW</span>
                <ArrowRight className="w-4 h-4 text-[#050505]" />
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-4 rounded-full border transition-all flex items-center justify-center ${
                  isFavorited
                    ? 'bg-[#050505] text-[#D6A85F] border-[#D6A85F]'
                    : 'bg-[#1C1C21] border-white/15 text-[#A7A7AE] hover:text-[#D6A85F] hover:border-[#D6A85F]'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-[#D6A85F]' : ''}`} />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs: Specifications Table / Key Features / Customer Reviews / Q&A */}
      <div className="pt-10 border-t border-white/10">
        
        <div className="flex flex-wrap gap-4 sm:gap-8 border-b border-white/10 pb-3">
          {[
            { id: 'specs', label: 'SPECIFICATIONS TABLE' },
            { id: 'features', label: 'KEY FEATURES' },
            { id: 'description', label: 'FULL DESCRIPTION' },
            { id: 'reviews', label: `REVIEWS (${product.reviews?.length || product.reviewCount || 0})` },
            { id: 'questions', label: `Q&A (${questions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs uppercase font-sans tracking-luxury font-bold pb-2 relative transition-all ${
                activeTab === tab.id ? 'text-[#F5F5F5]' : 'text-[#A7A7AE] hover:text-[#F5F5F5]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D6A85F]" />
              )}
            </button>
          ))}
        </div>

        <div className="py-8">
          {/* Specifications Table */}
          {activeTab === 'specs' && product.specifications && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="p-4 rounded-2xl bg-[#151519] border border-white/10 flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono tracking-wider text-[#A7A7AE]">
                    {key}
                  </span>
                  <span className="font-serif text-sm font-semibold text-[#F5F5F5] text-right ml-4">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Key Features */}
          {activeTab === 'features' && (
            <div className="space-y-4 max-w-3xl">
              {product.features?.map((feat, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#151519] border border-white/10 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-[#1C1C21] text-[#D6A85F] text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 border border-[#D6A85F]/30 font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-[#F5F5F5] font-sans leading-relaxed">
                    {feat}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Full Description */}
          {activeTab === 'description' && (
            <div className="p-6 rounded-3xl bg-[#151519] border border-white/10 max-w-3xl">
              <p className="text-sm sm:text-base text-[#A7A7AE] font-sans leading-relaxed whitespace-pre-line">
                {product.fullDescription || product.description}
              </p>
            </div>
          )}

          {/* Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 max-w-3xl">
              {(product.reviews || [
                { user: 'Vikramaditya S.', date: '2 days ago', rating: 5, text: 'Exceeded all expectations. The packaging, finish, and performance are absolute perfection.' },
                { user: 'Elena Rostova', date: '1 week ago', rating: 5, text: 'Arrived within 24 hours in pristine condition. WSHOP escrow gave total peace of mind.' },
                { user: 'Arjun Mehta', date: '2 weeks ago', rating: 4, text: 'Great premium experience. Everything feels authentic and well built.' }
              ]).map((rev, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#151519] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#F5F5F5]">{rev.user}</span>
                    <span className="text-[10px] text-[#A7A7AE] font-mono">{rev.date}</span>
                  </div>
                  <div className="flex text-[#D6A85F]">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#D6A85F]" />
                    ))}
                  </div>
                  <p className="text-xs text-[#A7A7AE] italic font-sans leading-relaxed">
                    “{rev.text}”
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Questions & Answers */}
          {activeTab === 'questions' && (
            <div className="space-y-6 max-w-3xl">
              <div className="space-y-3">
                {questions.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#151519] border border-white/10 space-y-1.5">
                    <div className="flex items-start space-x-2">
                      <HelpCircle className="w-4 h-4 text-[#D6A85F] mt-0.5 shrink-0" />
                      <span className="font-semibold text-xs text-[#F5F5F5]">{item.q}</span>
                    </div>
                    <p className="text-xs text-[#A7A7AE] pl-6 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>

              {/* Ask Question Form */}
              <form onSubmit={handleAddQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Inquire with verified seller regarding specifications, delivery, or warranty..."
                  className="flex-1 h-12 px-4 rounded-full bg-[#1C1C21] border border-white/15 text-xs font-sans text-[#F5F5F5] focus:outline-none focus:border-[#D6A85F]"
                />
                <button
                  type="submit"
                  className="px-6 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold hover:bg-[#F0C982]"
                >
                  ASK QUESTION
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A7A7AE] block mb-1">
                COMPLEMENTARY SELECTIONS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F5F5]">
                Related Products
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedProducts.map((relProd) => (
              <ProductCard
                key={relProd.id}
                product={relProd}
                onViewDetails={() => {
                  if (onSelectProduct) {
                    onSelectProduct(relProd);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                onBuyNow={() => onBuyNow(relProd)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

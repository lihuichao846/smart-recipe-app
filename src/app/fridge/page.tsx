'use client';

import React, { useState } from 'react';
import { db, Ingredient } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import CameraCapture from '@/components/CameraCapture';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, Plus, Trash2, Refrigerator, Camera, List, Minus, Snowflake, Beef, Fish, IceCream, X, Settings } from 'lucide-react';
import Link from 'next/link';
import { estimateExpiryDate } from '@/lib/utils';
import FloatingFood from '@/components/FloatingFood';
import { identifyIngredients } from '@/lib/client-ai';

import { motion, AnimatePresence } from 'framer-motion';

// --- Cute Icon System Helper ---
const getIngredientIcon = (name: string, category: string) => {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  // 0. Special Handling (Priority)
  if (n.includes('蛋')) return <span className="text-3xl">🥚</span>;
  if (n.includes('橙汁') || n.includes('果汁')) return <span className="text-3xl">🧃</span>;

  // 1. Meat / Seafood
  if (n.includes('牛排') || n.includes('牛肉')) return <span className="text-3xl">🥩</span>;
  if (n.includes('虾') || n.includes('虾仁')) return <span className="text-3xl">🍤</span>;
  if (n.includes('鱼') || c.includes('海鲜')) return <span className="text-3xl">🐟</span>;
  if (n.includes('猪肉') || n.includes('五花肉')) return <span className="text-3xl">🥓</span>;
  if (n.includes('鸡') || n.includes('鸡翅')) return <span className="text-3xl">🍗</span>;
  if (n.includes('火腿') || n.includes('香肠')) return <span className="text-3xl">🌭</span>;

  // 2. Frozen Treats / Drinks
  if (n.includes('冰淇淋') || n.includes('雪糕')) return <span className="text-3xl">🍦</span>;
  if (n.includes('冰块')) return <span className="text-3xl">🧊</span>;
  if (n.includes('酸奶') || n.includes('牛奶') || n.includes('奶')) return <span className="text-3xl">🥛</span>;
  if (n.includes('可乐') || n.includes('雪碧') || n.includes('饮料') || n.includes('茶')) return <span className="text-3xl">🥤</span>;
  if (n.includes('酒') || n.includes('啤')) return <span className="text-3xl">🍺</span>;
  if (n.includes('咖啡')) return <span className="text-3xl">☕</span>;

  // 3. Dumplings / Dim Sum / Noodles
  if (n.includes('饺子') || n.includes('水饺')) return <span className="text-3xl">🥟</span>;
  if (n.includes('包子') || n.includes('馒头')) return <span className="text-3xl">🥡</span>;
  if (n.includes('面') || n.includes('粉')) return <span className="text-3xl">🍜</span>;

  // 4. Fruits / Veggies
  if (n.includes('蓝莓')) return <span className="text-3xl">🫐</span>;
  if (n.includes('草莓')) return <span className="text-3xl">🍓</span>;
  if (n.includes('苹果')) return <span className="text-3xl">🍎</span>;
  if (n.includes('香蕉')) return <span className="text-3xl">🍌</span>;
  if (n.includes('橙') || n.includes('橘')) return <span className="text-3xl">🍊</span>;
  if (n.includes('葡萄') || n.includes('提子')) return <span className="text-3xl">🍇</span>;
  if (n.includes('瓜')) return <span className="text-3xl">🍉</span>;
  if (n.includes('桃')) return <span className="text-3xl">🍑</span>;
  if (n.includes('柠檬')) return <span className="text-3xl">🍋</span>;
  if (n.includes('梨')) return <span className="text-3xl">🍐</span>;
  if (n.includes('樱桃') || n.includes('车厘子')) return <span className="text-3xl">🍒</span>;
  if (n.includes('椰')) return <span className="text-3xl">🥥</span>;
  if (n.includes('芒果')) return <span className="text-3xl">🥭</span>;
  
  if (n.includes('胡萝卜')) return <span className="text-3xl">🥕</span>;
  if (n.includes('玉米')) return <span className="text-3xl">🌽</span>;
  if (n.includes('西红柿') || n.includes('番茄')) return <span className="text-3xl">🍅</span>;
  if (n.includes('土豆') || n.includes('马铃薯')) return <span className="text-3xl">🥔</span>;
  if (n.includes('茄子')) return <span className="text-3xl">🍆</span>;
  if (n.includes('西兰花') || n.includes('花菜')) return <span className="text-3xl">🥦</span>;
  if (n.includes('蘑菇') || n.includes('菌') || n.includes('菇')) return <span className="text-3xl">🍄</span>;
  if (n.includes('葱') || n.includes('蒜') || n.includes('洋葱')) return <span className="text-3xl">🧅</span>;
  if (n.includes('椒') || n.includes('辣')) return <span className="text-3xl">🫑</span>;
  if (n.includes('青菜') || n.includes('蔬菜') || c.includes('蔬菜') || n.includes('菜')) return <span className="text-3xl">🥬</span>;
  
  // 5. Bakery / Staple
  if (n.includes('面包') || n.includes('吐司')) return <span className="text-3xl">🍞</span>;
  if (n.includes('米') || n.includes('饭') || n.includes('粥')) return <span className="text-3xl">🍚</span>;
  if (n.includes('奶酪') || n.includes('芝士')) return <span className="text-3xl">🧀</span>;
  if (n.includes('披萨')) return <span className="text-3xl">🍕</span>;
  if (n.includes('汉堡')) return <span className="text-3xl">🍔</span>;
  if (n.includes('三明治')) return <span className="text-3xl">🥪</span>;
  if (n.includes('薯条')) return <span className="text-3xl">🍟</span>;
  if (n.includes('甜甜圈')) return <span className="text-3xl">🍩</span>;
  if (n.includes('饼干') || n.includes('曲奇')) return <span className="text-3xl">🍪</span>;
  if (n.includes('巧克力')) return <span className="text-3xl">🍫</span>;
  if (n.includes('糖')) return <span className="text-3xl">🍬</span>;
  if (n.includes('蛋糕')) return <span className="text-3xl">🍰</span>;

  // Fallback: First char
  return <span className="text-2xl font-black">{name[0]}</span>;
};

export default function FridgeManager() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'fridge' | 'freezer'>('fridge'); // 'fridge' or 'freezer'
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null); // For Details Modal
  
  // Temperature State
  const [fridgeTemp, setFridgeTemp] = useState(4);
  const [freezerTemp, setFreezerTemp] = useState(-18);
  const [showTempModal, setShowTempModal] = useState(false);
  const [bubbles, setBubbles] = useState<Array<{left: string, width: string, height: string, duration: string, delay: string}>>([]);
  const [snowflakes, setSnowflakes] = useState<Array<{left: string, top: string, duration: string, delay: string, fontSize: string, opacity: number}>>([]);
  const [mist, setMist] = useState<Array<{left: string, width: string, duration: string, delay: string}>>([]);

  // Load temps
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const ft = localStorage.getItem('fridgeTemp');
      const fzt = localStorage.getItem('freezerTemp');
      if (ft) setFridgeTemp(parseInt(ft));
      if (fzt) setFreezerTemp(parseInt(fzt));

      // Generate random bubbles - More visible now
      setBubbles([...Array(35)].map(() => ({
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 40 + 20}px`,
        height: `${Math.random() * 40 + 20}px`,
        duration: `${Math.random() * 8 + 5}s`,
        delay: `${Math.random() * 5}s`
      })));

      // Generate random snowflakes
      setSnowflakes([...Array(12)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `-${Math.random() * 20 + 10}px`,
        duration: `${Math.random() * 5 + 5}s`,
        delay: `${Math.random() * 5}s`,
        fontSize: `${Math.random() * 24 + 16}px`,
        opacity: Math.random() * 0.5 + 0.3
      })));

      // Generate random mist for fridge
      setMist([...Array(8)].map(() => ({
        left: `${Math.random() * 80 + 10}%`,
        width: `${Math.random() * 150 + 100}px`,
        duration: `${Math.random() * 4 + 4}s`,
        delay: `${Math.random() * 3}s`
      })));
    }
  }, []);

  // Save temps
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fridgeTemp', fridgeTemp.toString());
      localStorage.setItem('freezerTemp', freezerTemp.toString());
    }
  }, [fridgeTemp, freezerTemp]);

  const [newItem, setNewItem] = useState<Partial<Ingredient>>({
    name: '',
    quantity: '1',
    category: '其他',
    addDate: new Date(),
    expiryDate: addDays(new Date(), 7),
    storage: 'fridge'
  });

  const ingredients = useLiveQuery(() => db.ingredients.toArray());

  // Auto-fill expiry date when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Only update expiry date if we are in fridge mode
    if (newItem.storage !== 'freezer') {
        const expiryDate = estimateExpiryDate(name);
        setNewItem({
          ...newItem,
          name,
          expiryDate
        });
    } else {
        setNewItem({
          ...newItem,
          name
        });
    }
  };

  // Handle manual add
  const handleAddItem = async () => {
    if (!newItem.name) return;
    
    try {
      await db.ingredients.add({
        name: newItem.name,
        quantity: newItem.quantity || '1',
        category: newItem.category || '其他',
        addDate: new Date(),
        expiryDate: newItem.storage === 'freezer' ? undefined : (newItem.expiryDate || estimateExpiryDate(newItem.name)),
        storage: newItem.storage || 'fridge'
      } as Ingredient);
      
      setNewItem({
        name: '',
        quantity: '1',
        category: '其他',
        addDate: new Date(),
        expiryDate: addDays(new Date(), 7),
        storage: 'fridge'
      });
      setManualMode(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    await db.ingredients.delete(id);
  };

  // Handle quantity update
  const handleUpdateQuantity = async (id: number, currentQuantity: string, delta: number) => {
    const match = currentQuantity.match(/^(\d*\.?\d+)(.*)$/);
    if (match) {
      let val = parseFloat(match[1]);
      const suffix = match[2];
      val += delta;
      
      if (val <= 0) {
        // If quantity reaches 0, delete the item
        await db.ingredients.delete(id);
        
        // If the item was open in the modal, close it
        if (selectedItem?.id === id) {
            setSelectedItem(null);
        }
      } else {
        const newQuantity = `${Number(val.toFixed(2))}${suffix}`; 
        await db.ingredients.update(id, { quantity: newQuantity });
        
        // Update modal state if open
        if (selectedItem?.id === id) {
            setSelectedItem(prev => prev ? ({...prev, quantity: newQuantity}) : null);
        }
      }
    } else {
      // Fallback for non-numeric quantities: do nothing or maybe try to append
      console.log('Cannot parse quantity:', currentQuantity);
    }
  };

  // Handle camera capture and identification
  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    try {
      // Use client-side AI instead of API route for APK compatibility
      const items = await identifyIngredients(imageData);
      
      if (items && Array.isArray(items)) {
        // Bulk add identified items
        const newItems = items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity || '1',
          category: item.category || '其他',
          addDate: new Date(),
          expiryDate: estimateExpiryDate(item.name), // Use our smart helper
          imageUrl: imageData // Optional: store the image too if needed
        }));
        
        await db.ingredients.bulkAdd(newItems);
      }
      setShowCamera(false);
    } catch (error) {
      console.error('Identification failed:', error);
      alert('识别失败，请重试或手动添加 (请确保 NEXT_PUBLIC_OPENAI_API_KEY 已配置)');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle storage toggle
  const handleToggleStorage = async (item: Ingredient) => {
    if (!item.id) return;
    const newStorage = item.storage === 'freezer' ? 'fridge' : 'freezer';
    
    // Logic: 
    // 1. If moving to freezer, KEEP the expiry date (do not clear it), so it can be restored if moved back.
    // 2. If moving to fridge, only estimate if there is NO expiry date.
    
    const updates: Partial<Ingredient> = {
      storage: newStorage
    };

    // Only set expiry date if it's missing and we are moving to fridge
    if (newStorage === 'fridge' && !item.expiryDate) {
        updates.expiryDate = estimateExpiryDate(item.name);
    }
    
    await db.ingredients.update(item.id, updates);
  };

  // Filter ingredients based on active tab
  const filteredIngredients = ingredients?.filter(item => {
    if (activeTab === 'freezer') return item.storage === 'freezer';
    return item.storage !== 'freezer'; // Default to fridge if undefined
  });

  // Chunk helper for shelf layout
  const chunkArray = (arr: Ingredient[], size: number) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  const ingredientRows = chunkArray(filteredIngredients || [], 2);

  // Stagger Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0 }
  };

  const shelfVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: { opacity: 0, y: 20 }
  };
  
  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-1000 ease-in-out ${
        activeTab === 'fridge' ? 'bg-[#e8f4f8]' : 'bg-[#dbeafe]'
    }`}>
      {/* Fridge Interior Background with AnimatePresence */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatePresence mode="wait">
            {activeTab === 'fridge' ? (
                <motion.div 
                    key="fridge-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    {/* Fridge Atmosphere */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#e0f7fa] to-[#d6eef5]" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.1),transparent_50%)]" />
                    
                    {/* Mist Effects */}
                    {mist.map((m, i) => (
                        <div 
                            key={`mist-${i}`}
                            className="absolute bottom-0 bg-white/40 blur-3xl rounded-full animate-mist pointer-events-none"
                            style={{
                                left: m.left,
                                width: m.width,
                                height: m.width,
                                animationDuration: m.duration,
                                animationDelay: m.delay,
                            }}
                        />
                    ))}

                    {/* Bubbles */}
                    {bubbles.map((b, i) => (
                        <div 
                            key={`bubble-${i}`}
                            className="absolute rounded-full bg-white/60 border border-white/40 animate-rise"
                            style={{
                                left: b.left,
                                width: b.width,
                                height: b.height,
                                animationDuration: b.duration,
                                animationDelay: b.delay,
                            }}
                        />
                    ))}
                </motion.div>
            ) : (
                <motion.div 
                    key="freezer-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    {/* Freezer Atmosphere */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe]" />
                    
                    {/* Ice Crack Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239ca3af' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundSize: '120px 120px' 
                    }} />

                    {/* Frost Border Effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/60 to-transparent rounded-br-[100%] blur-xl" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/60 to-transparent rounded-bl-[100%] blur-xl" />
                        <div className="absolute inset-0 border-[20px] border-white/20" style={{ boxShadow: 'inset 0 0 60px rgba(191, 219, 254, 0.6)' }} />
                    </div>

                    {/* Falling Snowflakes */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {snowflakes.map((s, i) => (
                            <div 
                                key={`snow-${i}`}
                                className="absolute text-blue-300/60 animate-fall"
                                style={{
                                    left: s.left,
                                    top: s.top,
                                    animationDuration: s.duration,
                                    animationDelay: s.delay,
                                    fontSize: s.fontSize,
                                    opacity: s.opacity
                                }}
                            >
                                ❄
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Cold air effect - Persistent but color changes */}
        <div className={`absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t pointer-events-none transition-colors duration-1000 ${activeTab === 'fridge' ? 'from-white/60' : 'from-blue-200/60'}`} />
      </div>

      <div className="relative z-10 pb-20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-blue-50">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="p-2 -ml-2 text-gray-600 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Refrigerator className="text-blue-400" size={20} />
              冰箱库存
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-md mx-auto p-4 space-y-6">
          {/* Freezer/Fridge Toggle Switch */}
        <div className="bg-white/80 backdrop-blur p-1.5 rounded-[20px] shadow-sm mb-8 border border-white/50 relative flex overflow-hidden ring-4 ring-blue-50/50">
          {/* Sliding Background */}
          <motion.div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-[16px] shadow-md`}
            animate={{
                left: activeTab === 'fridge' ? '6px' : 'calc(50% + 3px)',
                background: activeTab === 'fridge' 
                    ? 'linear-gradient(to right, #ffedd5, #fed7aa)' 
                    : 'linear-gradient(to right, #dbeafe, #bfdbfe)'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          <button 
            onClick={() => setActiveTab('fridge')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-colors relative z-10 flex items-center justify-center gap-2 ${
              activeTab === 'fridge' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Refrigerator size={20} className={activeTab === 'fridge' ? 'animate-bounce-slight' : ''} />
            <span className="tracking-wide">冷藏区</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'fridge' ? 'bg-white/50' : 'bg-gray-100'}`}>
                {ingredients?.filter(i => i.storage !== 'freezer').length || 0}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('freezer')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-colors relative z-10 flex items-center justify-center gap-2 ${
              activeTab === 'freezer' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Snowflake size={20} className={activeTab === 'freezer' ? 'animate-spin-slow' : ''} />
            <span className="tracking-wide">冷冻区</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'freezer' ? 'bg-white/50' : 'bg-gray-100'}`}>
                {ingredients?.filter(i => i.storage === 'freezer').length || 0}
            </span>
          </button>
        </div>

        {/* Temperature Display */}
        <div className="flex justify-center -mt-4 mb-4">
            <button
                onClick={() => setShowTempModal(true)}
                className="bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/50 shadow-sm flex items-center gap-2 hover:bg-white/60 transition-colors active:scale-95 group"
            >
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">当前温度</span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`text-xl font-black font-mono ${activeTab === 'fridge' ? 'text-green-500' : 'text-blue-500'}`}
                    >
                        {activeTab === 'fridge' ? `${fridgeTemp}°C` : `${freezerTemp}°C`}
                    </motion.span>
                </AnimatePresence>
                <span className="bg-white/50 rounded-full p-1 ml-1 text-gray-400 group-hover:text-gray-600 transition-colors">
                    <Settings size={14} />
                </span>
            </button>
        </div>

        {/* Stats - Sticky Notes Style */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="relative group rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
             {/* Pin/Magnet */}
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400 shadow-sm border border-red-500 z-20" />
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400 animate-ping opacity-20" />
             
             <div className="p-4 pt-6 bg-[#fffdeb] shadow-md border-b-4 border-[#e6e2be] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-100/50 rounded-bl-3xl" />
                <p className="text-xs text-yellow-700/60 font-black mb-1 tracking-wider uppercase">{activeTab === 'fridge' ? '冷藏总数' : '冷冻总数'}</p>
                <p className="text-4xl font-black text-yellow-800/80 font-mono tracking-tighter animate-flicker">{filteredIngredients?.length || 0}</p>
             </div>
          </div>

          <div className="relative group rotate-[2deg] hover:rotate-0 transition-transform duration-300">
             {/* Pin/Magnet */}
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-sm border border-blue-500 z-20" />
             
             <div className="p-4 pt-6 bg-white shadow-md border-b-4 border-gray-100 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-gray-50 rounded-bl-3xl" />
                <p className={`text-xs font-black mb-1 tracking-wider uppercase ${activeTab === 'fridge' ? 'text-red-400' : 'text-blue-400'}`}>
                    {activeTab === 'fridge' ? '即将过期' : '久置提醒'}
                </p>
                <p className={`text-4xl font-black font-mono tracking-tighter animate-flicker ${activeTab === 'fridge' ? 'text-red-500' : 'text-blue-500'}`}>
                  {activeTab === 'fridge' 
                    ? (filteredIngredients?.filter(i => i.expiryDate && i.expiryDate < addDays(new Date(), 2)).length || 0)
                    : (filteredIngredients?.filter(i => i.addDate < addDays(new Date(), -30)).length || 0)
                  }
                </p>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!showCamera && !manualMode && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowCamera(true)}
                className="btn-cute btn-primary w-full shadow-lg shadow-orange-200"
              >
                <Camera size={20} />
                拍照录入
              </button>
              <button 
                onClick={() => setManualMode(true)}
                className="btn-cute btn-secondary w-full"
              >
                <Plus size={20} />
                手动添加
              </button>
            </div>
          </div>
        )}

        {/* Camera View */}
        {showCamera && (
          <div className="bg-black rounded-[32px] overflow-hidden mb-8 relative border-4 border-gray-100 shadow-xl">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setShowCamera(false)} className="text-white bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border border-white/20">取消</button>
            </div>
            {isProcessing ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                <p className="font-bold">AI 正在识别食材...</p>
              </div>
            ) : (
              <div className="p-0">
                <CameraCapture onCapture={handleCapture} />
              </div>
            )}
          </div>
        )}

        {/* Manual Input Form - Styled as a Drawer */}
        {manualMode && (
          <div className="bg-white/90 backdrop-blur-md p-6 mb-8 animate-slide-up rounded-3xl border-2 border-blue-100 shadow-xl relative overflow-hidden">
            {/* Drawer Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
            
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 mt-2">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <Plus size={18} />
              </span>
              放入新食材
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">存放位置</label>
                <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-200">
                  <button 
                    onClick={() => setNewItem({...newItem, storage: 'fridge'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${newItem.storage !== 'freezer' ? 'bg-white shadow-sm text-blue-500 scale-100 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Refrigerator size={18} /> 冷藏层
                  </button>
                  <button 
                    onClick={() => setNewItem({...newItem, storage: 'freezer'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${newItem.storage === 'freezer' ? 'bg-blue-500 shadow-sm text-white scale-100 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Snowflake size={18} /> 冷冻层
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">食材名称</label>
                <input 
                  value={newItem.name}
                  onChange={handleNameChange}
                  className="w-full p-4 bg-white rounded-2xl border-2 border-blue-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-bold text-gray-700 placeholder:text-gray-300"
                  placeholder="例如：新鲜鸡蛋"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">数量</label>
                  <input 
                    value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                    className="w-full p-4 bg-white rounded-2xl border-2 border-blue-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="1个"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                     {newItem.storage === 'freezer' ? '放入时间' : '过期时间'}
                  </label>
                  {newItem.storage === 'freezer' ? (
                     <div className="w-full p-4 bg-blue-50/50 text-blue-400 rounded-2xl border-2 border-blue-100/50 font-medium flex items-center gap-2">
                       <Snowflake size={16} />
                       <span>永久保鲜</span>
                     </div>
                  ) : (
                    <input 
                      type="date"
                      value={newItem.expiryDate ? format(newItem.expiryDate, 'yyyy-MM-dd') : ''}
                      onChange={e => {
                        const dateVal = e.target.value ? new Date(e.target.value) : undefined;
                        setNewItem({...newItem, expiryDate: dateVal});
                      }}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[var(--primary)] focus:bg-white transition-all outline-none font-medium shadow-inner focus:shadow-lg"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleAddItem} className="btn-cute btn-primary flex-1 py-3.5 text-lg shadow-lg shadow-green-100 hover:shadow-green-200 active:scale-95 transition-all">确认添加</button>
                <button onClick={() => setManualMode(false)} className="btn-cute bg-gray-100 text-gray-500 hover:bg-gray-200 py-3.5">取消</button>
              </div>
            </div>
          </div>
        )}

        {/* Temp Settings Modal */}
        {showTempModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setShowTempModal(false)}>
                <div 
                    className="bg-white rounded-[32px] w-full max-w-xs p-6 shadow-2xl relative animate-slide-up border-4 border-white ring-4 ring-blue-50 overflow-hidden text-center"
                    onClick={e => e.stopPropagation()}
                >
                    <h3 className="text-xl font-black text-gray-700 mb-6 flex items-center justify-center gap-2">
                        <Settings size={20} className="text-gray-400" />
                        设置{activeTab === 'fridge' ? '冷藏' : '冷冻'}温度
                    </h3>
                    
                    <div className="mb-8 relative">
                        <span className={`text-6xl font-black font-mono ${activeTab === 'fridge' ? 'text-green-500' : 'text-blue-500'}`}>
                            {activeTab === 'fridge' ? fridgeTemp : freezerTemp}°C
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-bold bg-gray-100 py-1 px-3 rounded-full inline-block">
                            {activeTab === 'fridge' ? '建议范围: 2°C ~ 8°C' : '建议范围: -16°C ~ -24°C'}
                        </p>
                    </div>

                    <div className="relative w-full h-6 mb-8 flex items-center">
                        <input 
                            type="range"
                            min={activeTab === 'fridge' ? 0 : -30}
                            max={activeTab === 'fridge' ? 10 : -10}
                            value={activeTab === 'fridge' ? fridgeTemp : freezerTemp}
                            onChange={(e) => activeTab === 'fridge' ? setFridgeTemp(parseInt(e.target.value)) : setFreezerTemp(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            style={{ accentColor: activeTab === 'fridge' ? '#22c55e' : '#3b82f6' }}
                        />
                    </div>

                    <button 
                        onClick={() => setShowTempModal(false)}
                        className={`w-full btn-cute py-3 text-lg shadow-lg ${
                            activeTab === 'fridge' 
                            ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-400' 
                            : 'bg-blue-500 text-white shadow-blue-200 hover:bg-blue-400'
                        }`}
                    >
                        完成设置
                    </button>
                </div>
            </div>
        )}

        {/* Details Modal */}
        {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedItem(null)}>
                <div 
                    className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl relative animate-slide-up border-4 border-white ring-4 ring-blue-50 overflow-hidden" 
                    onClick={e => e.stopPropagation()}
                >
                    {/* Background Decor */}
                    <div className={`absolute top-0 left-0 right-0 h-32 ${selectedItem.storage === 'freezer' ? 'bg-blue-50' : 'bg-orange-50'} rounded-b-[50%] -z-10`} />
                    
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center pt-8">
                         {/* Big Icon */}
                         <div className={`
                            w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-lg mb-6
                            ${selectedItem.storage === 'freezer' ? 'bg-blue-100 text-blue-500' : 'bg-orange-100 text-orange-500'}
                            animate-bounce-slow
                         `}>
                            <span className="text-7xl drop-shadow-md flex items-center justify-center">
                                {getIngredientIcon(selectedItem.name, selectedItem.category)}
                            </span>
                         </div>

                         <h2 className="text-2xl font-black text-gray-800 mb-2">{selectedItem.name}</h2>
                         
                         <div className="flex gap-2 mb-6">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                                {selectedItem.category}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedItem.storage === 'freezer' ? 'bg-blue-100 text-blue-500' : 'bg-orange-100 text-orange-500'}`}>
                                {selectedItem.storage === 'freezer' ? '❄️ 冷冻中' : '🧊 冷藏中'}
                            </span>
                         </div>

                         {/* Stats Grid */}
                         <div className="grid grid-cols-2 gap-3 w-full mb-6">
                            <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold mb-1">剩余数量</p>
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => selectedItem.id && handleUpdateQuantity(selectedItem.id, selectedItem.quantity, -1)}
                                        className="w-6 h-6 bg-white rounded-full shadow-sm text-gray-400 flex items-center justify-center hover:text-blue-500"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-lg font-black text-gray-700">{selectedItem.quantity}</span>
                                    <button 
                                        onClick={() => selectedItem.id && handleUpdateQuantity(selectedItem.id, selectedItem.quantity, 1)}
                                        className="w-6 h-6 bg-white rounded-full shadow-sm text-gray-400 flex items-center justify-center hover:text-blue-500"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold mb-1">
                                    {selectedItem.storage === 'freezer' ? '放入日期' : '过期时间'}
                                </p>
                                <p className="text-lg font-black text-gray-700">
                                    {selectedItem.storage === 'freezer' 
                                        ? format(selectedItem.addDate, 'MM-dd') 
                                        : selectedItem.expiryDate ? format(selectedItem.expiryDate, 'MM-dd') : 'N/A'}
                                </p>
                            </div>
                         </div>

                         {/* Actions */}
                         <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => { handleToggleStorage(selectedItem); setSelectedItem(null); }}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                                    selectedItem.storage === 'freezer' 
                                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                }`}
                            >
                                {selectedItem.storage === 'freezer' ? <Refrigerator size={18} /> : <Snowflake size={18} />}
                                {selectedItem.storage === 'freezer' ? '移至冷藏' : '移至冷冻'}
                            </button>
                            <button 
                                onClick={() => { if(selectedItem.id) handleDelete(selectedItem.id); setSelectedItem(null); }}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 size={18} />
                                丢弃
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Inventory Grid / Shelves */}
        <div className="space-y-4 pb-32 px-2">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-6 pl-2 bg-white/50 w-fit px-4 py-1 rounded-full backdrop-blur-sm shadow-sm sticky top-20 z-30">
            <List size={20} className="text-[var(--primary)]" />
            当前库存
          </h3>
          
          {filteredIngredients?.length === 0 ? (
            <motion.div 
                key="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20 text-gray-400 border-4 border-dashed border-blue-100 rounded-[3rem] bg-white/30 backdrop-blur-sm mx-4"
            >
              {activeTab === 'fridge' ? (
                <div className="animate-float">
                    <Refrigerator size={64} className="mx-auto mb-4 text-blue-200" />
                    <p className="font-bold text-blue-300">冷藏区空空如也~</p>
                    <p className="text-sm text-blue-200 mt-2">快去填满它吧！</p>
                </div>
              ) : (
                <div className="animate-float">
                    <Snowflake size={64} className="mx-auto mb-4 text-blue-200" />
                    <p className="font-bold text-blue-300">冷冻区好冷清...</p>
                    <p className="text-sm text-blue-200 mt-2">只有风在吹~</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
                key={activeTab}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-12" // Spacing between shelves
            >
              {ingredientRows.map((row, rowIndex) => (
                <motion.div 
                    key={`shelf-${rowIndex}`} 
                    variants={shelfVariants}
                    className="relative pt-4 pb-2 px-2"
                >
                    {/* Glass Shelf Visual */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-white/10 via-white/40 to-white/10 backdrop-blur-sm rounded-[100%] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-white/40 z-0">
                         {/* Shelf Highlight */}
                         <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-white/60" />
                    </div>

                    {/* Items on Shelf */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0 relative z-10 items-end">
                        {row.map(item => {
                            const daysUntilExpiry = item.expiryDate 
                            ? Math.ceil((item.expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                            : 999;
                            
                            const isFrozen = item.storage === 'freezer';
                            const isExpiring = !isFrozen && daysUntilExpiry <= 2;
                            const isExpired = !isFrozen && daysUntilExpiry < 0;
                            
                            // Determine Mood
                            let moodEmoji = "😊";
                            if (isFrozen) moodEmoji = "🥶";
                            else if (isExpired) moodEmoji = "😵";
                            else if (isExpiring) moodEmoji = "😰";

                            // Color Themes
                            const themeColor = isFrozen ? 'blue' : isExpiring ? 'orange' : isExpired ? 'red' : 'green';
                            const borderColor = isFrozen ? 'border-blue-100' : isExpiring ? 'border-orange-100' : isExpired ? 'border-red-100' : 'border-white';
                            const shadowColor = isFrozen ? 'shadow-blue-200/50' : isExpiring ? 'shadow-orange-200/50' : isExpired ? 'shadow-red-200/50' : 'shadow-gray-200/50';

                            return (
                                <motion.div 
                                    key={item.id} 
                                    className="relative group perspective-1000 flex flex-col items-center"
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    {/* Capsule Card */}
                                    <div className={`
                                        relative w-full aspect-[3/4]
                                        bg-white rounded-[2.5rem]
                                        border-4 ${borderColor}
                                        shadow-lg ${shadowColor}
                                        overflow-hidden
                                        flex flex-col items-center justify-center
                                        transition-all duration-300
                                        cursor-pointer
                                        ${isFrozen ? 'animate-shiver' : ''}
                                    `}
                                    onClick={() => setSelectedItem(item)}
                                    >
                                        {/* Top Frost Decor */}
                                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/80 to-transparent opacity-80 z-10" />
                                        
                                        {/* Frost Pattern Overlay (if frozen) */}
                                        {isFrozen && (
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/ice-age.png')] opacity-10 pointer-events-none mix-blend-overlay z-20" />
                                        )}
                                        
                                        {/* Quantity Badge (Top Right Corner) */}
                                        <div className={`
                                            absolute top-3 right-3 z-30
                                            px-2 py-1 rounded-full text-xs font-black shadow-sm
                                            ${isFrozen ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'}
                                            border border-white/50
                                        `}>
                                            x{item.quantity}
                                        </div>

                                        {/* Freshness Badge (Top Left Corner) */}
                                        {!isFrozen && (
                                            <div className={`
                                                absolute top-3 left-3 z-30
                                                px-2 py-1 rounded-full text-[10px] font-black shadow-sm
                                                ${isExpiring ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}
                                                border border-white/50
                                            `}>
                                                {daysUntilExpiry}天
                                            </div>
                                        )}

                                        {/* Main Icon */}
                                        <div className="relative z-20 mb-2 transform group-hover:scale-110 transition-transform duration-300">
                                            <div className={`
                                                w-20 h-20 rounded-[1.5rem] flex items-center justify-center
                                                ${isFrozen ? 'bg-blue-50' : 'bg-gray-50'}
                                                shadow-inner
                                            `}>
                                                <span className="text-5xl filter drop-shadow-sm">
                                                    {getIngredientIcon(item.name, item.category)}
                                                </span>
                                            </div>
                                            {/* Mood Emoji */}
                                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md text-sm border-2 border-white transform rotate-12">
                                                {moodEmoji}
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div className="relative z-20 text-center px-2 w-full">
                                            <h4 className="font-black text-gray-700 text-sm truncate w-full mb-1">
                                                {item.name}
                                            </h4>
                                        </div>

                                        {/* Quick Actions (Hover Only) */}
                                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                                            {/* Decrease Qty */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); item.id && handleUpdateQuantity(item.id, item.quantity, -1); }}
                                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 shadow-sm transition-all active:scale-90"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            
                                            {/* Delete Item */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); item.id && handleDelete(item.id); }}
                                                className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-500 shadow-sm transition-all active:scale-90"
                                            >
                                                <Trash2 size={12} />
                                            </button>

                                            {/* Increase Qty */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); item.id && handleUpdateQuantity(item.id, item.quantity, 1); }}
                                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 shadow-sm transition-all active:scale-90"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Reflection on Shelf */}
                                    <div className="w-[80%] h-2 bg-black/5 blur-sm rounded-[100%] mt-[-4px] z-0" />
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  </div>
  );
}

'use client';

import React, { useState } from 'react';
import { db, Ingredient } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import CameraCapture from '@/components/CameraCapture';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, Plus, Trash2, Refrigerator, Camera, List, Minus, Snowflake } from 'lucide-react';
import Link from 'next/link';
import { estimateExpiryDate } from '@/lib/utils';
import FloatingFood from '@/components/FloatingFood';

export default function FridgeManager() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'fridge' | 'freezer'>('fridge'); // 'fridge' or 'freezer'
  
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
      
      // Prevent negative quantity
      if (val < 0) val = 0;
      
      // If quantity reaches 0, ask to delete? Or just keep at 0.
      // Let's keep at 0 for now, user can manually delete.
      
      const newQuantity = `${Number(val.toFixed(2))}${suffix}`; 
      await db.ingredients.update(id, { quantity: newQuantity });
    } else {
      // Fallback for non-numeric quantities: do nothing or maybe try to append
      console.log('Cannot parse quantity:', currentQuantity);
    }
  };

  // Handle camera capture and identification
  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();
      
      if (data.items && Array.isArray(data.items)) {
        // Bulk add identified items
        const newItems = data.items.map((item: any) => ({
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
      alert('识别失败，请重试或手动添加');
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

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 pb-24 relative overflow-hidden">
      <FloatingFood />
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Refrigerator className="text-blue-500" />
            冰箱库存管理
          </h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm mb-8 border border-gray-100 relative">
          <button 
            onClick={() => setActiveTab('fridge')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative z-10 ${
              activeTab === 'fridge' 
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-orange-200' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Refrigerator size={18} /> 冷藏区 ({ingredients?.filter(i => i.storage !== 'freezer').length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('freezer')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative z-10 ${
              activeTab === 'freezer' 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Snowflake size={18} /> 冷冻区 ({ingredients?.filter(i => i.storage === 'freezer').length || 0})
          </button>
        </div>

        {/* Stats - Dynamic based on tab */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="cute-card p-6 bg-gradient-to-br from-[var(--info-bg)] to-white border-[var(--info-bg)]">
            <p className="text-sm text-[var(--info-text)] font-bold mb-1">{activeTab === 'fridge' ? '冷藏总数' : '冷冻总数'}</p>
            <p className="text-4xl font-black text-[var(--info-text)]">{filteredIngredients?.length || 0}</p>
          </div>
          <div className="cute-card p-6 bg-gradient-to-br from-[var(--warning-bg)] to-white border-[var(--warning-bg)]">
            <p className="text-sm text-[var(--warning-text)] font-bold mb-1">{activeTab === 'fridge' ? '即将过期' : '久置提醒'}</p>
            <p className="text-4xl font-black text-[var(--warning-text)]">
              {activeTab === 'fridge' 
                ? (filteredIngredients?.filter(i => i.expiryDate && i.expiryDate < addDays(new Date(), 2)).length || 0)
                : (filteredIngredients?.filter(i => i.addDate < addDays(new Date(), -30)).length || 0) // Example: frozen for > 30 days
              }
            </p>
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

        {/* Manual Input Form */}
        {manualMode && (
          <div className="cute-card p-6 mb-8 animate-fade-in bg-white">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[var(--accent)] rounded-full"></span>
              添加新食材
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">存放位置</label>
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setNewItem({...newItem, storage: 'fridge'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${newItem.storage !== 'freezer' ? 'bg-white shadow-md text-[var(--primary)] scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Refrigerator size={18} /> 冷藏区
                  </button>
                  <button 
                    onClick={() => setNewItem({...newItem, storage: 'freezer'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${newItem.storage === 'freezer' ? 'bg-white shadow-md text-blue-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Snowflake size={18} /> 冷冻区
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">名称</label>
                <input 
                  value={newItem.name}
                  onChange={handleNameChange}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[var(--primary)] focus:bg-white transition-all outline-none font-medium shadow-inner focus:shadow-lg"
                  placeholder="例如：鸡蛋"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">数量</label>
                  <input 
                    value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[var(--primary)] focus:bg-white transition-all outline-none font-medium shadow-inner focus:shadow-lg"
                    placeholder="1个"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">
                     {newItem.storage === 'freezer' ? '放入时间' : '过期时间'}
                  </label>
                  {newItem.storage === 'freezer' ? (
                     <div className="w-full p-4 bg-blue-50 text-blue-400 rounded-2xl border-2 border-transparent font-medium flex items-center gap-2 shadow-inner">
                       <Snowflake size={16} />
                       <span>无需设置</span>
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

        {/* Inventory List */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4 pl-2">
            <List size={20} className="text-[var(--primary)]" />
            当前库存
          </h3>
          
          {filteredIngredients?.length === 0 ? (
            <div className="text-center py-16 text-gray-400 cute-card border-dashed bg-[var(--background)]">
              {activeTab === 'fridge' ? <Refrigerator size={48} className="mx-auto mb-4 opacity-20" /> : <Snowflake size={48} className="mx-auto mb-4 opacity-20" />}
              <p className="font-medium">{activeTab === 'fridge' ? '冷藏区空空如也' : '冷冻区没有食材'}</p>
            </div>
          ) : (
            filteredIngredients?.map(item => {
              const daysUntilExpiry = item.expiryDate 
                ? Math.ceil((item.expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                : 999;
              
              const isFrozen = item.storage === 'freezer';
              const isExpiring = !isFrozen && daysUntilExpiry <= 2; // 临过期 (<= 2 days)
              const isExpired = !isFrozen && daysUntilExpiry < 0;   // 已过期
              
              // Logic: Expired or Near Expiry (<= 2 days) -> RED
              // Safe (> 2 days) -> Green
              const isWarningState = isExpired || isExpiring;

              return (
                <div key={item.id} className="cute-card p-4 flex items-center justify-between group bg-white hover:scale-[1.02] transition-all duration-300 hover:shadow-lg animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm relative overflow-hidden transition-colors duration-300
                      ${isWarningState ? 'bg-red-100 text-red-600' : isFrozen ? 'bg-blue-100 text-blue-600' : 'bg-[var(--secondary)] text-[#2d5a40]'}
                    `}>
                      {isFrozen && <Snowflake size={32} className="absolute -right-1 -bottom-1 text-blue-200 opacity-50" />}
                      <span className="relative z-10 scale-110 group-hover:scale-125 transition-transform duration-300">{item.name[0]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2 group-hover:text-[var(--primary)] transition-colors">
                        {item.name}
                      </h4>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-1">
                        <button 
                          onClick={() => item.id && handleUpdateQuantity(item.id, item.quantity, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-[var(--primary)] hover:text-white active:scale-90 transition-all shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <p className="text-sm text-gray-500 font-bold min-w-[3rem] text-center bg-gray-50 py-0.5 rounded-md">{item.quantity}</p>
                        <button 
                          onClick={() => item.id && handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-[var(--primary)] hover:text-white active:scale-90 transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                        <span className="text-xs text-gray-400 ml-1">· {item.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <p className={`text-sm font-bold transition-colors duration-300 ${isWarningState ? 'text-red-500 animate-pulse' : isFrozen ? 'text-blue-500' : 'text-green-600'}`}>
                        {isFrozen ? '已冷冻' : isExpired ? '已过期' : isExpiring ? '临近过期' : `${daysUntilExpiry}天后过期`}
                      </p>
                      <p className="text-xs text-gray-300 font-medium">
                        {isFrozen ? `放入: ${format(item.addDate, 'MM-dd', { locale: zhCN })}` : item.expiryDate ? format(item.expiryDate, 'MM-dd', { locale: zhCN }) : ''}
                      </p>
                    </div>
                    
                    {/* Storage Toggle Button - Independent & Visible */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStorage(item);
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-sm ${
                        isFrozen 
                          ? 'bg-orange-50 text-orange-500 hover:bg-orange-100 hover:shadow-orange-100' 
                          : 'bg-blue-50 text-blue-500 hover:bg-blue-100 hover:shadow-blue-100'
                      }`}
                      title={isFrozen ? "移动到冷藏" : "移动到冷冻"}
                    >
                      {isFrozen ? <Refrigerator size={20} /> : <Snowflake size={20} />}
                    </button>

                    <button 
                      onClick={() => item.id && handleDelete(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all hover:scale-110 active:scale-95"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })

          )}
        </div>
      </div>
    </main>
  );
}

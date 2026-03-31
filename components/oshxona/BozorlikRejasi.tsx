
import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from '../../services/api';
import { SearchableSelect } from '../SearchableSelect';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface RecipeIngredient {
  productId: string;
  productName: string;
  baseQty: number;
  unit: string;
}

interface PlannedDish {
  id: string;
  tovarId: string;
  tovarName: string;
  quantity: number;
  ingredients: RecipeIngredient[];
  recipeSecondaryQty: number;
}

export const BozorlikRejasi: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [normas, setNormas] = useState<any[]>([]);
  
  const [plannedDishes, setPlannedDishes] = useState<PlannedDish[]>([]);
  const productsTableRef = useRef<HTMLDivElement>(null);

  const handleClearAll = () => {
    if (window.confirm("Barcha tanlangan taomlarni o'chirib tashlamoqchimisiz?")) {
      setPlannedDishes([]);
    }
  };

  const handleDownloadPDF = async () => {
    if (!productsTableRef.current) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(productsTableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowHeight: productsTableRef.current.scrollHeight + 500,
        onclone: (clonedDoc) => {
          const element = clonedDoc.getElementById('pdf-table-content');
          if (element) {
            element.style.height = 'auto';
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';
            element.style.backgroundColor = '#ffffff';
            element.style.fontFamily = '"Calibri", "Helvetica", "Arial", sans-serif';
            element.style.fontSize = '12pt';
            
            // Aggressive style reset for print
            const all = element.querySelectorAll('*');
            all.forEach((el: any) => {
              if (el.tagName !== 'TH' && el.tagName !== 'THEAD') {
                el.style.backgroundColor = '#ffffff';
              }
              el.style.color = '#000000';
              el.style.borderColor = '#eeeeee';
              el.style.boxShadow = 'none';
              el.style.fontFamily = '"Calibri", "Helvetica", "Arial", sans-serif';
              el.style.fontSize = '12pt';
              
              // Fix for flex overlap in html2canvas
              if (el.classList.contains('flex')) {
                el.style.display = 'flex';
                el.style.justifyContent = el.classList.contains('justify-end') ? 'flex-end' : 'flex-start';
                el.style.alignItems = 'baseline';
                el.style.gap = '20px'; // Increased gap to prevent overlap
              }
            });

            const thead = element.querySelector('thead');
            if (thead) {
              thead.style.position = 'static';
              thead.style.top = 'auto';
              thead.style.zIndex = 'auto';
              thead.style.backgroundColor = '#f3f4f6';
              const ths = thead.querySelectorAll('th');
              ths.forEach((th: any) => {
                th.style.backgroundColor = '#f3f4f6';
                th.style.color = '#000000';
                th.style.position = 'static';
                th.style.fontSize = '12pt';
                th.style.fontFamily = '"Calibri", "Helvetica", "Arial", sans-serif';
              });
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const date = new Date().toLocaleDateString();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      
      // Title
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Bozorlik Ro'yxati", margin, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Sana: ${date}`, margin, 28);
      
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const firstPageUsableHeight = pageHeight - 35 - margin;
      const subsequentPageUsableHeight = pageHeight - (margin * 2);
      
      let heightLeft = imgHeight;
      let yOffset = 0; // Offset in the image (mm)

      // Page 1
      doc.addImage(imgData, 'PNG', margin, 35, imgWidth, imgHeight);
      
      // Cover bottom margin of page 1
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - margin, pageWidth, margin, 'F');
      
      heightLeft -= firstPageUsableHeight;
      yOffset += firstPageUsableHeight;

      // Add subsequent pages if needed
      while (heightLeft > 0) {
        doc.addPage();
        const position = margin - yOffset;
        doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        
        // Cover top margin
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, margin, 'F');
        
        // Cover bottom margin
        doc.rect(0, pageHeight - margin, pageWidth, margin, 'F');
        
        heightLeft -= subsequentPageUsableHeight;
        yOffset += subsequentPageUsableHeight;
      }
      
      doc.save(`bozorlik_royxati_${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("PDF yaratishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, nData] = await Promise.all([
        fetchData('tovarlar'), 
        fetchData('norma')
      ]);
      setTovarlar(Array.isArray(tData) ? tData.filter(t => t['tovar turi']?.toString().toLowerCase() === 'ovqat') : []);
      setNormas(Array.isArray(nData) ? nData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDish = (tovarId: string) => {
    if (!tovarId) return;

    const tovar = tovarlar.find(t => t['tovar id'] === tovarId);
    if (!tovar) return;

    const foodNormas = normas.filter(n => n['tovar id'] === tovarId);
    if (foodNormas.length === 0) {
      alert("Ushbu taom uchun retsept topilmadi!");
      return;
    }

    const latestId = Array.from(new Set(foodNormas.map(n => n['norma id']))).slice(-1)[0];
    const latestRows = foodNormas.filter(n => n['norma id'] === latestId);

    const recipeIngredients: RecipeIngredient[] = latestRows.map(row => ({
      productId: row['product id'],
      productName: row['product'],
      baseQty: Number(row['product miqdor']),
      unit: row['product birlik']
    }));

    const newPlannedDish: PlannedDish = {
      id: Math.random().toString(36).substr(2, 9),
      tovarId: tovarId,
      tovarName: tovar['tovar'],
      quantity: 100, // Default quantity for quick add
      ingredients: recipeIngredients,
      recipeSecondaryQty: Number(latestRows[0]['tovar miqdor']) || 1
    };

    setPlannedDishes([newPlannedDish, ...plannedDishes]);
  };

  const updateDishQuantity = (id: string, newQty: number) => {
    setPlannedDishes(plannedDishes.map(d => d.id === id ? { ...d, quantity: newQty } : d));
  };

  const handleRemoveDish = (id: string) => {
    setPlannedDishes(plannedDishes.filter(d => d.id !== id));
  };

  const calculateTotals = () => {
    const totals: Record<string, { name: string, qty: number, unit: string }> = {};

    plannedDishes.forEach(dish => {
      dish.ingredients.forEach(ing => {
        const needed = (ing.baseQty / dish.recipeSecondaryQty) * dish.quantity;
        if (totals[ing.productId]) {
          totals[ing.productId].qty += needed;
        } else {
          totals[ing.productId] = {
            name: ing.productName,
            qty: needed,
            unit: ing.unit
          };
        }
      });
    });

    return Object.values(totals).sort((a, b) => a.name.localeCompare(b.name));
  };

  const totalIngredients = calculateTotals();

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-32">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Selected Dishes Table */}
        <div className="xl:col-span-6">
          <div className="glass-card rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-xl h-[calc(100vh-120px)] flex flex-col">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between shrink-0">
              <div className="flex-grow mr-4">
                <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Ovqat qo'shish</h5>
                <SearchableSelect 
                  placeholder="Ovqat nomini yozing (masalan: Palov)..."
                  options={tovarlar.map(t => ({ id: t['tovar id'], label: t['tovar'] }))}
                  value=""
                  onSelect={(val) => handleAddDish(val as string)}
                  className="!bg-zinc-950 border-zinc-800"
                />
              </div>
              {plannedDishes.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="mt-6 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  title="Hammasini tozalash"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Tozalash</span>
                </button>
              )}
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/20">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-zinc-900 shadow-sm">
                  <tr className="border-b border-zinc-800 bg-black/20">
                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Taom nomi</th>
                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center w-32">Miqdori</th>
                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {plannedDishes.length > 0 ? (
                    plannedDishes.map((dish) => (
                      <tr key={dish.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <span className="text-xs font-black text-white uppercase tracking-tight">{dish.tovarName}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input 
                              type="number"
                              value={dish.quantity}
                              onChange={(e) => updateDishQuantity(dish.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-black text-indigo-400 text-center focus:border-indigo-500 outline-none tabular-nums"
                            />
                            <span className="text-[9px] font-bold text-zinc-600 uppercase">pors</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleRemoveDish(dish.id)}
                            className="text-zinc-600 hover:text-red-500 transition-colors font-black text-lg"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-16 text-center opacity-20 italic text-[10px] uppercase tracking-widest">
                        Ro'yxat bo'sh. Yuqoridan ovqat qidirib qo'shing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Total Ingredients Table */}
        <div className="xl:col-span-6">
          <div className="glass-card rounded-[2.5rem] border border-zinc-800 overflow-hidden flex flex-col shadow-2xl h-[calc(100vh-120px)]">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center shrink-0">
              <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Productlar bo'limi</h5>
              <span className="text-[9px] font-black px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                {totalIngredients.length} xil
              </span>
            </div>

            <div 
              ref={productsTableRef}
              id="pdf-table-content"
              className="flex-grow overflow-y-auto custom-scrollbar bg-black/20"
            >
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-zinc-900 shadow-sm">
                  <tr className="border-b border-zinc-800">
                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-1/2">Mahsulot</th>
                    <th className="p-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right w-1/2">Jami miqdori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {totalIngredients.length > 0 ? (
                    totalIngredients.map((ing, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest break-words">{ing.name}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-baseline justify-end gap-5">
                            <span className="text-lg font-black text-white tabular-nums">
                              {ing.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ')}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-700 uppercase shrink-0">{ing.unit}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-16 text-center opacity-20 italic text-[10px] uppercase tracking-widest">
                        Ro'yxat bo'sh
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalIngredients.length > 0 && (
              <div className="p-6 bg-zinc-950 border-t border-zinc-800 shrink-0">
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full py-4 bg-indigo-600 text-white border border-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                >
                  <span>📄 PDF shaklida yuklab olish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

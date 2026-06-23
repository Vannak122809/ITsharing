import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Type, Image as ImageIcon, Layout, ArrowLeft, Wand2, Share2, Palette, Smile, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CanvasStage from '../components/canvas/CanvasStage';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const DEFAULT_FONTS = ['Battambang', 'Hanuman', 'Moul', 'Koulen', 'Inter'];
const CATEGORIES = ['Birthday', 'Graduation', 'Wedding', 'Khmer New Year', 'Pchum Ben'];

const DUMMY_FRAMES = [
  { id: 'd1', name: 'Birthday Gold', src: 'https://placehold.co/800x800/png?text=Birthday+Gold+Frame', category: 'Birthday' },
  { id: 'd2', name: 'Graduation Blue', src: 'https://placehold.co/800x800/png?text=Graduation+Blue+Frame', category: 'Graduation' },
  { id: 'd3', name: 'Khmer Ornament', src: 'https://placehold.co/800x800/png?text=Khmer+Ornament+Frame', category: 'Khmer New Year' }
];

const MOCK_WISHES = {
  'Birthday': 'រីករាយថ្ងៃកំណើត សូមជូនពរឲ្យមានសុខភាពល្អ សំណាងល្អ និងជោគជ័យគ្រប់ភារកិច្ច។',
  'Graduation': 'សូមអបអរសាទរចំពោះការបញ្ចប់ការសិក្សា និងសូមជូនពរឲ្យទទួលបានជោគជ័យក្នុងអាជីពការងារ។',
  'Wedding': 'សូមអបអរសាទរថ្ងៃអាពាហ៍ពិពាហ៍ សូមឲ្យស្រលាញ់គ្នាដល់ចាស់កោងខ្នង។',
  'Khmer New Year': 'សួស្ដីឆ្នាំថ្មី ប្រពៃណីជាតិខ្មែរ សូមជូនពរឲ្យជួបតែសេចក្ដីសុខ។',
  'Pchum Ben': 'សូមឧទ្ទិសកុសលផលបុណ្យដល់ញាតិសន្តានដែលបានចែកឋានទៅ។'
};

const STICKERS = [
  { id: 's1', src: 'https://cdn-icons-png.flaticon.com/512/3284/3284615.png', name: 'Flower' },
  { id: 's2', src: 'https://cdn-icons-png.flaticon.com/512/864/864005.png', name: 'Crown' },
  { id: 's3', src: 'https://cdn-icons-png.flaticon.com/512/4028/4028448.png', name: 'Balloon' },
  { id: 's4', src: 'https://cdn-icons-png.flaticon.com/512/1000/1000214.png', name: 'Grad Cap' },
  { id: 's5', src: 'https://cdn-icons-png.flaticon.com/512/17030/17030736.png', name: 'Ornament' }
];

const FrameEditor = () => {
  const stageRef = useRef(null);
  
  // Editor State
  const [frames, setFrames] = useState([]);
  const [loadingFrames, setLoadingFrames] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [textLayers, setTextLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // Text Control State
  const [recipientName, setRecipientName] = useState('លោក វណ្ណៈ');
  const [wishMessage, setWishMessage] = useState('សូមជូនពរឲ្យជោគជ័យគ្រប់ភារកិច្ច');
  const [fontFamily, setFontFamily] = useState('Battambang');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(40);
  const [isBold, setIsBold] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);

  // New Canvas State
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [stickerLayers, setStickerLayers] = useState([]);
  
  // Photo State
  const [photoProps, setPhotoProps] = useState({
    x: 400, y: 400, width: 400, height: 400, rotation: 0, scale: 1
  });

  useEffect(() => {
    const q = query(collection(db, 'assets'), where('collection', 'array-contains', 'Frame'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedFrames = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().title,
        src: doc.data().url,
        category: doc.data().collection[0] || 'Frame',
      }));
      
      // Fallback to DUMMY_FRAMES if database is empty
      if (fetchedFrames.length === 0) {
        fetchedFrames = DUMMY_FRAMES;
      }
      
      setFrames(fetchedFrames);
      if (fetchedFrames.length > 0) {
        setSelectedFrame(prev => prev ? (fetchedFrames.find(f => f.id === prev.id) || null) : null);
      }
      setLoadingFrames(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync controls when a text layer is selected
  useEffect(() => {
    if (selectedId) {
      const selectedText = textLayers.find(t => t.id === selectedId);
      if (selectedText) {
        setFontFamily(selectedText.fontFamily || 'Battambang');
        setTextColor(selectedText.fill || '#ffffff');
        setFontSize(selectedText.fontSize || 40);
        setIsBold(selectedText.fontStyle === 'bold');
        setHasShadow(selectedText.shadowColor === '#000000');
      }
    }
  }, [selectedId, textLayers]);

  // Update selected layer when controls change
  const updateSelectedLayer = (updates) => {
    if (!selectedId) return;
    setTextLayers(prev => prev.map(layer => 
      layer.id === selectedId ? { ...layer, ...updates } : layer
    ));
  };
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addTextLayer = (textToUse, defaultY) => {
    const newLayer = {
      id: `text_${Date.now()}`,
      text: textToUse,
      fontFamily,
      fill: textColor,
      x: 150,
      y: defaultY,
      fontSize,
      fontStyle: isBold ? 'bold' : 'normal',
      shadowColor: hasShadow ? '#000000' : 'transparent',
      shadowBlur: hasShadow ? 5 : 0,
      shadowOffsetX: hasShadow ? 2 : 0,
      shadowOffsetY: hasShadow ? 2 : 0,
    };
    setTextLayers([...textLayers, newLayer]);
    setSelectedId(newLayer.id);
  };

  const addSticker = (src) => {
    setStickerLayers([...stickerLayers, { id: `sticker_${Date.now()}`, src }]);
  };

  const generateAIWish = () => {
    const currentCat = selectedFrame?.category || 'Birthday';
    const wish = MOCK_WISHES[currentCat] || MOCK_WISHES['Birthday'];
    setWishMessage(wish);
    toast.success('AI Wish Generated!');
  };

  const generateKhmerDate = () => {
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    
    // Convert to Khmer numerals
    const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const toKhmerNum = (num) => num.toString().split('').map(n => khmerNumerals[n]).join('');
    
    const dateText = `ថ្ងៃទី ${toKhmerNum(day)} ខែ${months[today.getMonth()]} ឆ្នាំ${toKhmerNum(year)}`;
    addTextLayer(dateText, 300);
    toast.success('Khmer Date Added!');
  };

  const handleDownload = (format = 'png', isSquare = false) => {
    if (stageRef.current) {
      const stage = stageRef.current;
      let dataUrlOptions = { 
        pixelRatio: format === 'png' ? 3 : 2, 
        mimeType: `image/${format}` 
      };

      if (isSquare) {
        // Crop perfectly from the center
        const size = Math.min(stage.width(), stage.height());
        dataUrlOptions = {
          ...dataUrlOptions,
          x: (stage.width() - size) / 2,
          y: (stage.height() - size) / 2,
          width: size,
          height: size
        };
      }

      const uri = stage.toDataURL(dataUrlOptions);
      const link = document.createElement('a');
      link.download = `Khmer_Greeting_${isSquare ? 'Profile_' : ''}${Date.now()}.${format}`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded ${isSquare ? '1:1 Square' : format.toUpperCase()} successfully!`);
    }
  };

  const handleShare = (platform) => {
    toast.success(`Preparing image for ${platform}...`);
    setTimeout(() => {
        if (navigator.share) {
            navigator.share({ title: 'Khmer Greeting', text: 'Made with ITSharing', url: window.location.href }).catch(() => {});
        } else {
            toast('Web Share not supported on this browser.', { icon: 'ℹ️' });
        }
    }, 1000);
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setTextLayers(prev => prev.filter(l => l.id !== selectedId));
      setStickerLayers(prev => prev.filter(l => l.id !== selectedId));
      setSelectedId(null);
      toast.success('Element deleted');
    }
  };

  // Ensure unselect when clicking empty space
  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  // Keybind for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          handleDeleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '20px' }}>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-gradient">បង្កើតស៊ុមជូនពរខ្មែរ (Khmer Frame Editor)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel - Controls */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Upload size={18} /> Upload Photo
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">Click or drag image</p>
              </div>
              <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handlePhotoUpload} />
            </label>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold flex items-center justify-between mb-4">
              <span className="flex items-center gap-2"><Type size={18} /> Add Text</span>
              <div className="flex gap-2">
                <button className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1 py-1 px-2 rounded" onClick={generateKhmerDate} title="Add Today's Date">
                  + 📅
                </button>
                <button className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-xs flex items-center gap-1 py-1 px-2 rounded" onClick={generateAIWish}>
                  <Wand2 size={12} /> AI Wish
                </button>
              </div>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name:</label>
                <div className="flex gap-2">
                  <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="input-field" placeholder="លោក វណ្ណៈ" />
                  <button className="btn btn-primary px-3" onClick={() => addTextLayer(recipientName, 100)}>+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Message:</label>
                <div className="flex gap-2">
                  <textarea value={wishMessage} onChange={(e) => setWishMessage(e.target.value)} className="input-field min-h-[60px]" placeholder="សូមជូនពរ..." />
                  <button className="btn btn-primary px-3" onClick={() => addTextLayer(wishMessage, 200)}>+</button>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Font</label>
                  <select 
                    className="input-field py-1 px-2 text-sm" 
                    value={fontFamily} 
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      updateSelectedLayer({ fontFamily: e.target.value });
                    }}
                  >
                    {DEFAULT_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Size & Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={Math.round(fontSize)} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFontSize(val);
                        updateSelectedLayer({ fontSize: val });
                      }} 
                      className="input-field py-1 px-2 text-sm w-16" 
                    />
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        updateSelectedLayer({ fill: e.target.value });
                      }} 
                      className="w-full h-8 rounded cursor-pointer border-0" 
                    />
                  </div>
                </div>
                <div className="col-span-2 flex gap-2 mt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBold} 
                      onChange={(e) => {
                        setIsBold(e.target.checked);
                        updateSelectedLayer({ fontStyle: e.target.checked ? 'bold' : 'normal' });
                      }} 
                    /> Bold
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      checked={hasShadow} 
                      onChange={(e) => {
                        setHasShadow(e.target.checked);
                        updateSelectedLayer({ 
                          shadowColor: e.target.checked ? '#000000' : 'transparent',
                          shadowBlur: e.target.checked ? 5 : 0,
                          shadowOffsetX: e.target.checked ? 2 : 0,
                          shadowOffsetY: e.target.checked ? 2 : 0
                        });
                      }} 
                    /> Shadow
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Controls Panel */}
          {selectedId === 'user_photo' && (
            <div className="glass-panel p-5 border border-blue-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-xs px-2 py-1 rounded-bl text-white font-bold">Photo Active</div>
              <h3 className="text-md font-semibold flex items-center gap-2 mb-4 text-blue-400">
                <ImageIcon size={16} /> Photo Adjustments
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <label>Zoom (Scale)</label>
                    <span>{photoProps.scale.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="4" step="0.05" 
                    value={photoProps.scale} 
                    onChange={(e) => {
                      const newScale = parseFloat(e.target.value);
                      // Adjust width/height based on scale factor diff
                      const factor = newScale / (photoProps.scale || 1);
                      setPhotoProps({
                        ...photoProps,
                        scale: newScale,
                        width: photoProps.width * factor,
                        height: photoProps.height * factor
                      });
                    }}
                    className="w-full accent-blue-500" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <label>Rotation</label>
                    <span>{photoProps.rotation}°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" step="1" 
                    value={photoProps.rotation} 
                    onChange={(e) => setPhotoProps({ ...photoProps, rotation: Number(e.target.value) })}
                    className="w-full accent-blue-500" 
                  />
                  <div className="flex justify-between mt-1">
                    <button className="text-[10px] text-gray-500 hover:text-white" onClick={() => setPhotoProps({...photoProps, rotation: -90})}>-90°</button>
                    <button className="text-[10px] text-gray-500 hover:text-white" onClick={() => setPhotoProps({...photoProps, rotation: 0})}>0°</button>
                    <button className="text-[10px] text-gray-500 hover:text-white" onClick={() => setPhotoProps({...photoProps, rotation: 90})}>+90°</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Center - Canvas Preview */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="glass-panel p-4 flex flex-col items-center bg-gray-900 overflow-hidden relative" style={{ minHeight: '400px' }}>
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-sm text-gray-400">Preview (Drag elements to move/resize)</h3>
              <button 
                className={`btn btn-sm ${selectedId && selectedId !== 'user_photo' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 opacity-50 cursor-not-allowed'} text-xs`}
                onClick={handleDeleteSelected}
                disabled={!selectedId || selectedId === 'user_photo'}
              >
                Delete Selected
              </button>
            </div>
            
            <div className="shadow-2xl border border-gray-800 rounded overflow-hidden w-full max-w-full flex justify-center">
              <CanvasStage 
                ref={stageRef}
                frameUrl={selectedFrame?.src} 
                photoUrl={uploadedPhoto}
                photoProps={photoProps}
                setPhotoProps={setPhotoProps}
                textLayers={textLayers}
                setTextLayers={setTextLayers}
                stickerLayers={stickerLayers}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                checkDeselect={checkDeselect}
                canvasBgColor={canvasBgColor}
              />
            </div>

          </div>
        </div>

        {/* Right Panel - Settings */}
        <div className="lg:col-span-3 space-y-6 order-3">
          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold flex items-center justify-between mb-4">
              <span className="flex items-center gap-2"><Layout size={18} /> Select Frame</span>
              {selectedFrame && (
                <button 
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => setSelectedFrame(null)}
                >
                  Clear Frame
                </button>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {loadingFrames ? (
                <p className="text-gray-400 text-sm col-span-2 text-center py-4">Loading frames...</p>
              ) : frames.length > 0 ? (
                frames.map(frame => (
                  <div 
                    key={frame.id} 
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedFrame?.id === frame.id ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-gray-700 hover:border-gray-500'}`}
                    onClick={() => setSelectedFrame(prev => prev?.id === frame.id ? null : frame)}
                  >
                    <div className="aspect-square bg-gray-800 flex items-center justify-center p-2">
                      <img src={frame.src} alt={frame.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="text-xs text-center py-2 bg-gray-800 text-gray-300 truncate px-1 border-t border-gray-700" title={frame.name}>{frame.name}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm col-span-2 text-center py-4">
                  No frames found. Please add templates in the Admin Panel.
                </p>
              )}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Palette size={18} /> Background & Stickers
            </h3>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Canvas Background</label>
              <input type="color" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border-0" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Add Stickers</label>
              <div className="grid grid-cols-5 gap-2">
                {STICKERS.map(s => (
                  <div key={s.id} onClick={() => addSticker(s.src)} className="cursor-pointer bg-gray-800 rounded p-2 hover:bg-gray-700 flex items-center justify-center transition-colors" title={s.name}>
                    <img src={s.src} alt={s.name} className="w-8 h-8 object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Download size={18} /> Export & Share
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              <button className="btn btn-primary w-full" onClick={() => handleDownload('png')}>
                Download High Quality PNG
              </button>
              <button className="btn btn-outline w-full text-xs" onClick={() => handleDownload('jpeg', true)}>
                Download 1:1 Profile Pic (Facebook)
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <label className="text-xs text-gray-400 mb-2 block text-center">Share directly</label>
              <div className="flex justify-center gap-3">
                <button onClick={() => handleShare('Facebook')} className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors"><Facebook size={18} /></button>
                <button onClick={() => handleShare('Telegram')} className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center hover:bg-blue-500 transition-colors"><MessageCircle size={18} /></button>
                <button onClick={() => handleShare('Instagram')} className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center hover:bg-pink-700 transition-colors"><Instagram size={18} /></button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FrameEditor;

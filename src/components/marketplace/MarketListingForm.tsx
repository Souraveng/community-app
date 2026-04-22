'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMarketplace } from '../../hooks/useMarketplace';
import { uploadFile } from '../../lib/storage';
import Button from '../common/Button';
import Input from '../common/Input';

const MarketListingForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { user } = useAuth();
  const { createListing } = useMarketplace();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: 0,
    currency: 'USD' as 'USD' | 'INR',
    expires_at: '',
    use_timer: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadFile('marketplace', `listings/${Date.now()}-${imageFile.name}`, imageFile);
      }

      await createListing({
        title: formData.title,
        description: formData.description,
        starting_price: formData.starting_price,
        currency: formData.currency,
        image_url: imageUrl,
        expires_at: formData.use_timer && formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      });

      if (onSuccess) onSuccess();
      // Reset form
      setFormData({
        title: '',
        description: '',
        starting_price: 0,
        currency: 'USD',
        expires_at: '',
        use_timer: false
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Error creating marketplace listing:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low/50 p-8 rounded-[2.5rem] border border-outline-variant/10 space-y-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-black font-headlines tracking-tighter text-on-surface">Exhibit for Sale</h3>
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Post your masterpiece to the global marketplace</p>
      </div>

      <div className="space-y-6">
        <div 
          onClick={() => document.getElementById('market-image-upload')?.click()}
          className="aspect-video rounded-[2rem] border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-high/30 transition-all overflow-hidden relative group"
        >
          {imagePreview ? (
            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-2">add_photo_alternate</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Upload Artwork</p>
            </>
          )}
          <input type="file" id="market-image-upload" hidden accept="image/*" onChange={handleImageChange} />
        </div>

        <Input 
          label="Artwork Title"
          placeholder="e.g., The Ethereal Grid"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Curatorial Statement</label>
          <textarea 
            className="w-full bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 focus:outline-none focus:border-primary text-sm font-body min-h-[120px]"
            placeholder="Tell the story behind this piece..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Input 
              label="Starting Price"
              type="number"
              placeholder="0"
              value={formData.starting_price}
              onChange={(e) => setFormData({ ...formData, starting_price: Number(e.target.value) })}
              required
            />
            <span className="absolute right-6 top-[3.25rem] text-[10px] font-black text-primary uppercase">{formData.currency}</span>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Currency</label>
            <div className="flex gap-2 p-1 bg-surface-container-low border border-outline-variant/10 rounded-2xl h-[52px]">
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, currency: 'USD' })}
                className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${formData.currency === 'USD' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                USD ($)
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, currency: 'INR' })}
                className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${formData.currency === 'INR' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-outline-variant/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface">Automatic Session Timer</p>
              <p className="text-[10px] text-on-surface-variant opacity-40">System will automatically close bidding at your specified time.</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, use_timer: !formData.use_timer })}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.use_timer ? 'bg-primary' : 'bg-surface-container-highest'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.use_timer ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {formData.use_timer && (
            <Input 
              label="Bidding Expiration"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              required
            />
          )}
        </div>
      </div>

      <Button variant="primary" className="w-full py-4 rounded-[1.5rem] shadow-xl shadow-primary/20" disabled={loading}>
        {loading ? 'Curating Listing...' : 'Release to Marketplace'}
      </Button>
    </form>
  );
};

export default MarketListingForm;

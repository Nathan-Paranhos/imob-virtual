import React, { useState, useEffect } from 'react';
import {
  FaSpinner,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaIdCard,
  FaSave,
  FaCamera,
  FaTrashAlt
} from 'react-icons/fa';
import { updateUserProfile, getUserProfile, uploadFile } from '../../services/firebase';
import debounce from 'lodash.debounce';
import './ProfileForm.css';

const ProfileForm = ({ user }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    bio: '',
    profilePicture: '',
    profileComplete: false
  });
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setFormData({
            fullName: profile.fullName || user.displayName || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            company: profile.company || '',
            role: profile.role || '',
            bio: profile.bio || '',
            profilePicture: profile.profilePicture || '',
            profileComplete: profile.profileComplete || false
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };
    
    if (user) fetchProfile();
  }, [user]);

  const handleChange = debounce(({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, 300);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type))
      return setMessage({ type: 'error', text: 'Formato inválido. Use JPG, PNG, GIF ou WEBP.' });
    if (file.size > 2 * 1024 * 1024)
      return setMessage({ type: 'error', text: 'A imagem deve ter menos de 2MB.' });
    try {
      setUploadLoading(true);
      const path = `profile-pictures/${user.uid}/${Date.now()}_${file.name}`;
      const downloadURL = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, profilePicture: downloadURL }));
      setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setMessage({ type: 'error', text: 'Erro ao fazer upload da imagem.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemovePhoto = () => setFormData(prev => ({ ...prev, profilePicture: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Usuário não autenticado!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(user.uid, {
        ...formData,
        lastLogin: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Perfil atualizado!' });
    } catch (error) {
      let errorMessage = 'Erro ao atualizar perfil';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permissão negada para atualizar o perfil';
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-form-container">
      <h2>Seu Perfil</h2>
      <p className="profile-subtitle">Complete suas informações para uma melhor experiência</p>
      
      <div className="profile-photo-container">
        <div className="profile-photo">
          {formData.profilePicture ? (
            <img src={formData.profilePicture} alt="Foto de perfil" />
          ) : (
            <div className="profile-photo-placeholder">
              <FaUser />
            </div>
          )}
          {uploadLoading && (
            <div className="upload-spinner">
              <FaSpinner className="spinning" />
            </div>
          )}
          <div className="profile-photo-actions">
            <label htmlFor="photo-upload" className="photo-upload-btn">
              <FaCamera /><span>Alterar</span>
              <input type="file" id="photo encarregar" accept="image/*"
                onChange={handlePhotoUpload} disabled={uploadLoading || loading} />
            </label>
            {formData.profilePicture && (
              <button className="photo-remove-btn" onClick={handleRemovePhoto}
                disabled={uploadLoading || loading}>
                <FaTrashAlt />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">Nome Completo</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input type="text" id="fullName" name="fullName"
                value={formData.fullName} onChange={handleChange} required
                disabled={loading} placeholder="Digite seu nome completo" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input type="email" id="email" name="email"
                value={formData.email} onChange={handleChange} required disabled
                placeholder="Seu endereço de e-mail" />
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <div className="input-with-icon">
              <FaPhone className="input-icon" />
              <input type="tel" id="phone" name="phone"
                value={formData.phone} onChange={handleChange}
                placeholder="(00) 00000-0000" disabled={loading} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="company">Empresa</label>
            <div className="input-with-icon">
              <FaBuilding className="input-icon" />
              <input type="text" id="company" name="company"
                value={formData.company} onChange={handleChange}
                placeholder="Nome da empresa" disabled={loading} />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="role">Cargo</label>
          <div className="input-with-icon">
            <FaIdCard className="input-icon" />
            <input type="text" id="role" name="role"
              value={formData.role} onChange={handleChange}
              placeholder="Seu cargo ou função" disabled={loading} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="bio">Sobre Você</label>
          <textarea id="bio" name="bio"
            value={formData.bio} onChange={handleChange} rows="4"
            placeholder="Conte um pouco sobre você..." disabled={loading} />
        </div>
        <button type="submit" className="btn primary save-btn" disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="spinning" /> Salvando...
            </>
          ) : (
            <>
              <FaSave /> Salvar Perfil
            </>
          )}
        </button>
      </form>
      {loading && <FaSpinner className="spinner" />}
    </div>
  );
};

export default ProfileForm;

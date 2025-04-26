import { FaCheckCircle } from 'react-icons/fa';

const PropertyForm = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  const handleUploadComplete = async () => {
    try {
      // Gerar modelo 3D após upload
      const modelUrl = await generate3DModel(uploadedPhotos);
      setFieldValue('modelo3d', modelUrl);
    } catch (error) {
      console.error('Erro ao gerar modelo:', error);
    }
  };

  return (
    <div className="form-container">
      <div className="upload-section">
        <input
          type="file"
          multiple
          onChange={handlePhotoUpload}
          accept="image/*"
        />
        {uploadedPhotos.length > 0 && (
          <button 
            className="complete-btn"
            onClick={handleUploadComplete}
          >
            <FaCheckCircle />
            Concluir Upload
          </button>
        )}
      </div>
    </div>
  );
};
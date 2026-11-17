import { getAccessToken } from './googleAuth';
import { PORTAL_CONFIG } from '../config/portalConfig';

export interface DriveUploadedFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  directUrl?: string; // Direct image URL for <img> tags
}

export interface UploadMultipleResult {
  folderId: string;
  folderUrl: string;
  files: DriveUploadedFile[];
  imageUrls: string[];
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const OFFICIAL_PARENT_FOLDER_ID = PORTAL_CONFIG.DEFAULT_DRIVE_FOLDER_ID || "";
const FOLDER_NAME = "Qo'shko'pir_MMTB_Fayllar";

/**
 * Returns direct CDN image URL that can be rendered directly inside <img src="..."> tags.
 * Google's official public image edge CDN endpoint:
 */
export const getDirectDriveImageUrl = (fileId: string): string => {
  if (!fileId) return '';
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};

/**
 * Helper to convert local file to base64 Data URL (instant preview)
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sets public read permission ('anyone' with role 'reader') on a file or folder
 */
export const setPublicReaderPermission = async (fileId: string, token: string): Promise<boolean> => {
  try {
    const res = await fetch(`${DRIVE_API_URL}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
    return res.ok;
  } catch (err) {
    console.warn("Ruxsat berishda ogohlantirish:", err);
    return false;
  }
};

/**
 * Creates a dedicated sub-folder inside the official Google Drive folder (1xBvm3Oz0j4_n8YZB4sYPmA3EqcnqUp8d)
 * for a news article, organization, or event.
 */
export const createSubFolderInDrive = async (
  folderTitle: string,
  parentFolderId: string = OFFICIAL_PARENT_FOLDER_ID
): Promise<{ id: string; webViewLink: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Google hisobiga ulanmagan. Iltimos, avval 'Google bilan kirish' tugmasi orqali hisobingizga kiring.");

  // Sanitize folder name
  const safeName = folderTitle.replace(/[/\\?%*:|"<>]/g, ' ').trim() || `Material_${Date.now()}`;

  let newFolder: any = null;

  // Try creating in official parent folder
  try {
    const res = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
        description: `Qo'shko'pir tumani MMTB rasmiy portali materiallari to'plami (${new Date().toLocaleDateString('uz-UZ')})`
      })
    });

    if (res.ok) {
      newFolder = await res.json();
    } else {
      const errTxt = await res.text();
      console.warn("Parent papkada jild yaratishda ogohlantirish:", errTxt);
    }
  } catch (err) {
    console.warn("Drive jild yaratishda xato:", err);
  }

  // Fallback: create in user's root or portal folder if parent rejected
  if (!newFolder) {
    const fallbackRes = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        description: "Qo'shko'pir tumani MMTB rasmlari"
      })
    });

    if (!fallbackRes.ok) {
      const errTxt = await fallbackRes.text();
      throw new Error(`Google Drive'da jild yaratib bo'lmadi: ${errTxt}`);
    }
    newFolder = await fallbackRes.json();
  }

  // Set public read permission on the newly created subfolder
  await setPublicReaderPermission(newFolder.id, token);

  const folderUrl = `https://drive.google.com/drive/folders/${newFolder.id}`;
  return {
    id: newFolder.id,
    webViewLink: newFolder.webViewLink || folderUrl
  };
};

/**
 * Finds or creates the default folder for Qo'shko'pir MMTB files in user's Google Drive
 */
export const getOrCreatePortalFolder = async (): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Google hisobiga ulanmagan");

  // If the official folder is accessible, return it
  if (OFFICIAL_PARENT_FOLDER_ID) {
    try {
      const checkRes = await fetch(`${DRIVE_API_URL}/files/${OFFICIAL_PARENT_FOLDER_ID}?fields=id,name`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        return OFFICIAL_PARENT_FOLDER_ID;
      }
    } catch {}
  }

  // Search for folder
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: "Qo'shko'pir tumani maktabgacha va maktab ta'limi bo'limi portali rasmiy fayllari"
    })
  });

  if (!createRes.ok) {
    throw new Error("Google Drive'da jild yaratib bo'lmadi");
  }

  const newFolder = await createRes.json();
  await setPublicReaderPermission(newFolder.id, token);
  return newFolder.id;
};

/**
 * Uploads a single file to a specific Google Drive folder
 */
export const uploadFileToFolder = async (
  file: File,
  folderId: string
): Promise<DriveUploadedFile> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Google hisobiga ulanmagan. Iltimos, avval 'Google bilan kirish' tugmasi orqali hisobingizga kiring.");

  const metadata = {
    name: file.name,
    parents: [folderId],
    description: `Yuklangan sana: ${new Date().toLocaleDateString('uz-UZ')} (${file.name})`
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const metadataContentType = 'application/json; charset=UTF-8';
  const fileContentType = file.type || 'application/octet-stream';

  const multipartRequestBody = new Blob([
    delimiter,
    `Content-Type: ${metadataContentType}\r\n\r\n`,
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${fileContentType}\r\n`,
    'Content-Transfer-Encoding: base64\r\n\r\n',
    arrayBufferToBase64(fileData),
    closeDelimiter
  ]);

  const uploadRes = await fetch(
    `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!uploadRes.ok) {
    const errorMsg = await uploadRes.text();
    throw new Error(`Google Drive'ga yuklashda xatolik: ${errorMsg}`);
  }

  const uploadedFile = await uploadRes.json();

  // Set public reader permission so file can be rendered on site for anyone
  await setPublicReaderPermission(uploadedFile.id, token);

  const directUrl = getDirectDriveImageUrl(uploadedFile.id);

  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    size: formatFileSize(uploadedFile.size ? parseInt(uploadedFile.size, 10) : file.size),
    webViewLink: uploadedFile.webViewLink || `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    webContentLink: uploadedFile.webContentLink,
    directUrl
  };
};

/**
 * Uploads a file (image, document, PDF) to Google Drive in the default portal folder
 */
export const uploadFileToDrive = async (file: File): Promise<DriveUploadedFile> => {
  const folderId = await getOrCreatePortalFolder();
  return uploadFileToFolder(file, folderId);
};

/**
 * Uploads multiple files (e.g. news photos gallery) to Google Drive:
 * 1. Creates a dedicated subfolder inside the official parent folder (1xBvm3Oz0j4_n8YZB4sYPmA3EqcnqUp8d)
 * 2. Uploads all files sequentially with progress reporting
 * 3. Sets public permissions and returns direct image URLs
 */
export const uploadMultipleFilesToDrive = async (
  files: File[],
  folderTitle: string,
  existingFolderId?: string,
  onProgress?: (completed: number, total: number, fileName: string) => void
): Promise<UploadMultipleResult> => {
  let targetFolderId = existingFolderId;
  let targetFolderUrl = '';

  if (!targetFolderId) {
    // Admin (sayt egasi) Drive'idagi asosiy jild ichida yaratiladi
    const parentId = await getOrCreatePortalFolder();
    const subFolder = await createSubFolderInDrive(folderTitle, parentId);
    targetFolderId = subFolder.id;
    targetFolderUrl = subFolder.webViewLink;
  } else {
    targetFolderUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;
  }

  const uploadedFiles: DriveUploadedFile[] = [];
  const imageUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (onProgress) {
      onProgress(i + 1, files.length, f.name);
    }
    const uploaded = await uploadFileToFolder(f, targetFolderId);
    uploadedFiles.push(uploaded);
    const directUrl = uploaded.directUrl || getDirectDriveImageUrl(uploaded.id);
    imageUrls.push(directUrl);
  }

  return {
    folderId: targetFolderId,
    folderUrl: targetFolderUrl,
    files: uploadedFiles,
    imageUrls
  };
};

/**
 * Delete a file from Google Drive (MUST be confirmed by user beforehand)
 */
export const deleteFileFromDrive = async (fileId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Google hisobiga ulanmagan");

  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 404) {
    throw new Error("Faylni Google Drive'dan o'chirib bo'lmadi");
  }

  return true;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) return '1.2 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

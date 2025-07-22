import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Image, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
  articleId: string;
  onFileUploaded: (file: any) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
}

export const FileUpload = ({ articleId, onFileUploaded }: FileUploadProps) => {
  const { user } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleFileUpload = async (files: FileList) => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }

    for (const file of Array.from(files)) {
      const fileId = crypto.randomUUID();
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        id: fileId,
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);

      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${fileId}.${fileExt}`;
        const filePath = `${user.id}/${articleId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('article-files')
          .upload(filePath, file);

        // Simulate progress for UI feedback
        const interval = setInterval(() => {
          setUploadingFiles(prev =>
            prev.map(f => 
              f.id === fileId ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
            )
          );
        }, 100);

        // Complete progress after upload
        setTimeout(() => {
          clearInterval(interval);
          setUploadingFiles(prev =>
            prev.map(f => 
              f.id === fileId ? { ...f, progress: 100 } : f
            )
          );
        }, 1000);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('article-files')
          .getPublicUrl(filePath);

        // Save file record to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('article_files')
          .insert({
            article_id: articleId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Remove from uploading list
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        
        // Notify parent component
        onFileUploaded(fileRecord);
        
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }
    }
  };

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Upload Files</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or click to select
          </p>
          <Input
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="w-auto mx-auto"
          />
        </div>
      </div>

      {/* Uploading files list */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading Files</h4>
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="flex items-center space-x-2 p-2 border rounded">
              {getFileIcon(uploadingFile.file.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {uploadingFile.file.name}
                </div>
                <Progress value={uploadingFile.progress} className="h-2 mt-1" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadingFile(uploadingFile.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  consultationId: string;
  patientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  uploadDocument(file: File, patientId: string, consultationId: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('consultationId', consultationId);

    return this.http.post<Document>(`${this.apiUrl}/upload`, formData);
  }

  getDocumentsByConsultation(consultationId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/consultation/${consultationId}`);
  }

  getDocumentsByPatient(patientId: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${documentId}`, {
      responseType: 'blob'
    });
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`);
  }

  sendDocumentByEmail(documentId: string, email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/send-email`, {
      documentId,
      email
    });
  }
} 

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface HairType {
  id: string;
  type: string;
  level?: number;
  letter?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateHairTypeRequest {
  type: string;
  level?: number;
  letter?: string;
}

export interface UpdateHairTypeRequest {
  id: string;
  type?: string;
  level?: number;
  letter?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HairTypeService {
  private apiUrl = `${environment.apiUrl}/account/hair`;

  constructor(private http: HttpClient) {}

  getAllHairTypes(): Observable<HairType[]> {
    return this.http.get<ApiResponse<HairType[]>>(this.apiUrl).pipe(
      map(response => response.data || [])
    );
  }

  getHairTypeById(id: string): Observable<HairType> {
    return this.http.get<ApiResponse<HairType>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createHairType(hairType: CreateHairTypeRequest): Observable<HairType> {
    return this.http.post<ApiResponse<HairType>>(this.apiUrl, hairType).pipe(
      map(response => response.data)
    );
  }

  updateHairType(hairType: UpdateHairTypeRequest): Observable<HairType> {
    // A rota usa /hair/id mas o id vai no body
    return this.http.put<ApiResponse<HairType>>(`${this.apiUrl}/id`, hairType).pipe(
      map(response => response.data)
    );
  }

  deleteHairType(id: string): Observable<void> {
    // A rota usa /hair/id com query param ou pode usar /hair/:id
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(() => void 0)
    );
  }
}


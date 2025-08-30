import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { FeedbackService, Feedback } from '../../core/services/feedback.service';

@Component({
  selector: 'app-feedbacks',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './feedbacks.component.html',
  styleUrls: ['./feedbacks.component.scss']
})
export class FeedbacksComponent implements OnInit {
  feedbacks: Feedback[] = [];
  filteredFeedbacks: Feedback[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  filters = {
    rating: '',
    status: '',
    search: ''
  };
  selectedFeedbackId: number | null = null;
  newResponse = '';

  constructor(
    private feedbackService: FeedbackService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadFeedbacks();
  }

  loadFeedbacks() {
    this.isLoading = true;
    this.errorMessage = null;

    this.feedbackService.getFeedbacks().subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erro ao carregar feedbacks. Por favor, tente novamente.';
        this.isLoading = false;
        this.notificationService.error('Erro ao carregar feedbacks');
      }
    });
  }

  applyFilters() {
    this.filteredFeedbacks = this.feedbacks.filter(feedback => {
      const matchesRating = !this.filters.rating || feedback.rating === Number(this.filters.rating);
      const matchesStatus = !this.filters.status || feedback.status === this.filters.status;
      const matchesSearch = !this.filters.search || 
        feedback.patientName.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        feedback.doctorName.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesRating && matchesStatus && matchesSearch;
    });
  }

  showResponseForm(feedback: Feedback) {
    this.selectedFeedbackId = feedback.id;
    this.newResponse = '';
  }

  cancelResponse() {
    this.selectedFeedbackId = null;
    this.newResponse = '';
  }

  submitResponse(feedback: Feedback) {
    if (this.newResponse.trim()) {
      this.feedbackService.respondToFeedback(feedback.id, this.newResponse).subscribe({
        next: (updatedFeedback) => {
          const index = this.feedbacks.findIndex(f => f.id === feedback.id);
          if (index !== -1) {
            this.feedbacks[index] = updatedFeedback;
            this.applyFilters();
            this.selectedFeedbackId = null;
            this.newResponse = '';
            this.notificationService.success('Resposta enviada com sucesso');
          }
        },
        error: (error) => {
          this.notificationService.error('Erro ao enviar resposta');
        }
      });
    }
  }

  archiveFeedback(feedback: Feedback) {
    this.feedbackService.archiveFeedback(feedback.id).subscribe({
      next: (updatedFeedback) => {
        const index = this.feedbacks.findIndex(f => f.id === feedback.id);
        if (index !== -1) {
          this.feedbacks[index] = updatedFeedback;
          this.applyFilters();
          this.notificationService.success('Feedback arquivado com sucesso');
        }
      },
      error: (error) => {
        this.notificationService.error('Erro ao arquivar feedback');
      }
    });
  }

  deleteFeedback(feedbackId: number) {
    if (confirm('Tem certeza que deseja excluir este feedback?')) {
      this.feedbackService.deleteFeedback(feedbackId).subscribe({
        next: () => {
          this.feedbacks = this.feedbacks.filter(f => f.id !== feedbackId);
          this.applyFilters();
          this.notificationService.success('Feedback excluído com sucesso');
        },
        error: (error) => {
          this.notificationService.error('Erro ao excluir feedback');
        }
      });
    }
  }

  canEditField(field: string): boolean {
    return this.authService.canEditField(field);
  }
}

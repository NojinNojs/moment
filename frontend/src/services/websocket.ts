import { EventBus } from '@/lib/utils';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private userId: string | null = null;
  
  /**
   * Initialize WebSocket connection
   * @param userId User ID for the connection
   */
  connect(userId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    this.userId = userId;
    const token = localStorage.getItem('auth_token');
    
    if (!token || !userId) {
      console.warn('Cannot connect to WebSocket: missing authentication');
      return;
    }
    
    // Get API URL from environment variable or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Convert http/https to ws/wss
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    
    try {
      this.socket = new WebSocket(`${wsUrl}/ws?token=${token}`);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      console.log('Connecting to WebSocket server...');
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('Disconnecting from WebSocket server...');
    
    if (this.socket) {
      try {
        // Only close if not already closing or closed
        if (this.socket.readyState === WebSocket.OPEN || 
            this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      } finally {
        this.socket = null;
      }
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
    this.userId = null;
    
    console.log('WebSocket disconnected successfully');
  }
  
  /**
   * Send preference update to server
   * @param preference Name of the preference
   * @param value New value
   */
  sendPreferenceUpdate(preference: string, value: string | number | boolean): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }
    
    const message = JSON.stringify({
      type: 'preference_update',
      preference,
      value
    });
    
    this.socket.send(message);
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0;
    EventBus.emit('websocket:connected');
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      // Handle preference updates
      if (data.type === 'preference_updated') {
        EventBus.emit('preference:updated', {
          preference: data.preference,
          value: data.value
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
    this.socket = null;
    
    // Try to reconnect if not explicitly disconnected
    if (this.userId && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimeout = window.setTimeout(() => {
        this.connect(this.userId!);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Maximum reconnection attempts reached');
      EventBus.emit('websocket:failed');
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    
    // Check if this is a connection error
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('Error occurred before connection was established, will retry connection');
      // Try to reconnect if not already in reconnect cycle and user is logged in
      if (!this.reconnectTimeout && this.userId) {
        this.reconnectTimeout = window.setTimeout(() => {
          if (this.userId) {
            console.log(`Attempting to reconnect WebSocket after error...`);
            this.connect(this.userId);
          }
        }, this.reconnectDelay);
      }
    }
    
    EventBus.emit('websocket:error', error);
  }
  
  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 
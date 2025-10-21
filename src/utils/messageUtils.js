// Utility functions for message time formatting

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''; 
  try {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export const formatMessageDate = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    // Parse ISO timestamp correctly
    const messageDate = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(messageDate.getTime())) {
      console.error('Invalid date:', timestamp);
      return '';
    }
    
    const today = new Date();

    // Use date strings for comparison to avoid timezone issues
    const messageDateStr = messageDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const todayDateStr = today.toLocaleDateString('en-CA');
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDateStr = yesterday.toLocaleDateString('en-CA');

    if (messageDateStr === todayDateStr) {
      return 'Hôm nay';
    } else if (messageDateStr === yesterdayDateStr) {
      return 'Hôm qua';
    } else {
      // Format: "22/08/2025"
      return messageDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;
  if (!currentMessage.sentAt || !previousMessage.sentAt) return false;
  
  try {
    const currentDate = new Date(currentMessage.sentAt);
    const previousDate = new Date(previousMessage.sentAt);
    
    // Reset time để so sánh chỉ ngày
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const previousDateOnly = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());
    
    return currentDateOnly.getTime() !== previousDateOnly.getTime();
  } catch (error) {
    console.error('Error comparing dates:', error);
    return false;
  }
};

export const groupMessagesByDate = (messages) => {
  // Temporarily disable date separators to fix spacing issue
  return messages.map((message, index) => ({
    type: 'message',
    ...message,
    uniqueId: message.messageId || `msg-${index}-${Date.now()}`
  }));
};

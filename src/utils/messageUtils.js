// Utility functions for message time formatting

export const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatMessageDate = (timestamp) => {
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Reset time để so sánh chỉ ngày
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return 'Hôm nay';
  } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Hôm qua';
  } else {
    // Format: "T6 22/08/2025" 
    return messageDate.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

export const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.timestamp);
  const previousDate = new Date(previousMessage.timestamp);
  
  // Reset time để so sánh chỉ ngày
  const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const previousDateOnly = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());
  
  return currentDateOnly.getTime() !== previousDateOnly.getTime();
};

export const groupMessagesByDate = (messages) => {
  return messages.reduce((groups, message, index) => {
    const shouldShowSeparator = shouldShowDateSeparator(message, messages[index - 1]);
    
    if (shouldShowSeparator) {
      groups.push({
        type: 'date-separator',
        date: formatMessageDate(message.timestamp),
        timestamp: message.timestamp
      });
    }
    
    groups.push({
      type: 'message',
      ...message
    });
    
    return groups;
  }, []);
};

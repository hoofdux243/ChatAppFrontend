  // Update user status in conversations
  const updateUserStatus = (userStatus) => {
    console.log('DEBUG: updateUserStatus called with:', userStatus);
    
    if (!userStatus || !userStatus.id) {
      console.log('DEBUG: Invalid userStatus, skipping update');
      return;
    }
    
    setConversations(currentConversations => {
      console.log('DEBUG: Current conversations count:', currentConversations.length);
      
      const updated = currentConversations.map(conversation => {
        if (conversation.roomType === 'PRIVATE' && conversation.memberId === userStatus.id) {
          console.log('DEBUG: Found matching conversation, updating:', conversation.title);
          return {
            ...conversation,
            isOnline: userStatus.online,
            lastSeen: userStatus.lastSeen
          };
        }
        return conversation;
      });
      
      console.log('DEBUG: Returning updated conversations');
      return updated;
    });
  };
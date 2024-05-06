import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.book_id = self.scope['url_route']['kwargs']['book_id']
        self.group_name = f'book_comments_{self.book_id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'comment_message',
                'message': message
            }
        )

    async def comment_message(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'message': message
        }))

    async def new_comment(self, event):
        # Send the new comment data to WebSocket
        await self.send(text_data=json.dumps({
            'new_comment': event['message']
        }))


class FollowConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'user_follow_{self.user_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        event = text_data_json['event']
        follower_id = text_data_json['follower_id']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'follow_event',
                'event': event,
                'follower_id': follower_id
            }
        )

    async def follow_event(self, event):
        async def follow_event(self, event):
            # This will be triggered when a follow or unfollow event is sent
            await self.send(text_data=json.dumps({
                'event': event['event'],
                'follower_id': event['follower_id'],
            }))


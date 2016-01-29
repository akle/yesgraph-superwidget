# YesGraph SuperWidget: A Javascript SDK

YesGraph uses machine learning and social graph analysis to improve your app's viral growth. Given an address book, we rank your users' contacts so that they start sending better invites and you win!

Take a look at demo.html to see our Javascript SDK in action. When you're ready to try it out, here's how to get started:

1. Create an app on www.yesgraph.com
2. Find your unique App ID on the settings page. You'll use this in your client-side Javascript -- do NOT use your Secret Key.
3. Start coding!

Initialize the SDK:
```
var api = YesGraph({app: "YOUR_APP_ID"});
```
The API methods fetch data asynchronously, so you'll want to pass in the "responseHandler" argument, a function to be called on the data from the API response. For example:
```
function responseHandler (data) {
    console.log(data);
}
```

Now use the `test` method to check that your setup is working. [[docs]](https://docs.yesgraph.com/docs/test)
```
api.test(responseHandler);
```

Submitting raw address books and retrieving ranked ones are the bread and butter of this flow. All you need to do that are two methods!

Use the `rankContacts` method to submit a raw address book. [[docs]](https://docs.yesgraph.com/docs/address-book)
```
api.rankContacts(rawContacts, responseHandler);
```

Get a ranked address book using the `getRankedContacts` method. [[docs]](https://docs.yesgraph.com/docs/address-book)
```
api.getRankedContacts(responseHandler);
```

Once you've suggested some contacts to your user, tell us:
- which contacts the user saw,
- which contacts they invited, and
- which of those invites were accepted.

By tracking this data, we can progressively improve the ranking model for your app over time, and you'll grow faster!

Let us know which contacts the user saw with the `postSuggestedSeen` method. [[docs]](https://docs.yesgraph.com/docs/suggested-seen)
```
api.postSuggestedSeen(seenContacts, responseHandler);
```

Use the `postInvitesSent` method to tell us who invites were sent to. [[docs]](https://docs.yesgraph.com/docs/invites-sent)
```
api.postInvitesSent(invitesSent, responseHandler);
```

Use the `postInvitesAccepted` method to tell us which invites get accepted. [[docs]](https://docs.yesgraph.com/docs/invites-accepted)
```
api.postInvitesAccepted(invitesAccepted, responseHandler);
```

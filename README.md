# YesGraph SuperWidget: A Javascript SDK

YesGraph uses machine learning and social graph analysis to improve your app's viral growth. Given an address book, we rank your users' contacts so that they start sending more invites and you win!

## Getting Started
1. Create an app on www.yesgraph.com
2. Find your unique App ID on the settings page. You'll use this in your client-side Javascript -- do NOT use your Secret Key.
3. The SDK is built on jQuery, so include that and the SDK on your webpage, and get coding!
```
<script src="http://code.jquery.com/jquery-2.2.0.min.js"></script>
<script id="yesgraph" data-app="YOUR_APP_ID" src="yesgraph.js"></script>
```

## Contents
### Notes
- <a href="#responseHandlers">Response handlers</a>

### Methods
- <a href="#test">`test`</a>
- <a href="#rankContacts">`rankContacts`</a>
- <a href="#getRankedContacts">`getRankedContacts`</a>
- <a href="#postSuggestedSeen">`postSuggestedSeen`</a>
- <a href="#postInvitesSent">`postInvitesSent`</a>
- <a href="#postInvitesAccepted">`postInvitesAccepted`</a>


<hr>
## Reference
### Notes
<a name="responseHandlers"></a>
#### Response Handlers
All of the API methods fetch data asynchronously, so you'll want to <b>tell each method what to do</b> once the data is available. There are two ways to do this:

1. You can optionally pass a "responseHandler" argument to any of the API methods. This is just a function to be called on the data once we get a successful API response. For example:
    ```
    function myResponseHandler (data) {
        console.log(data);
    }

    YesGraphAPI.test(myResponseHandler);
    ```

2. Alternately, each of the API methods returns a [jQuery Promise](http://api.jquery.com/Types/#Promise) object, so you can also use any of the built-in methods for those: [then](http://api.jquery.com/deferred.then/), [done](http://api.jquery.com/deferred.done/), [fail](http://api.jquery.com/deferred.fail/), [always](http://api.jquery.com/deferred.always/), [pipe](http://api.jquery.com/deferred.pipe/), [progress](http://api.jquery.com/deferred.progress/), [state](http://api.jquery.com/deferred.state/), and [promise](http://api.jquery.com/deferred.promise/).
    <pre>
    YesGraphAPI.test()
               .done(handleSuccess)
               .fail(handleError)
               .pipe(doSomething)
               .then(doSomethingElse)
    </pre>
3. These two strategies can also work together:
    <pre>
    YesGraphAPI.test(handleSuccess)
               .fail(handleError)
               .always(doSomething)
    </pre>


### Methods
<a name="test"><hr></a>
####test
The `test` method is a convenience method, to help you confirm that you are properly set up and can access our API. You can optionally pass a <a href="#responseHandlers">responseHandler</a> argument. [[docs]](https://docs.yesgraph.com/docs/test)
```
YesGraphAPI.test();
```


<a name="rankContacts"><hr></a>
Submitting raw address books and retrieving ranked ones are the bread and butter of this flow. All you need to do that are two methods:

####rankContacts
Use the `rankContacts` method to submit a raw address book. Pass in a Javascript object representing an address book. You can optionally pass a <a href="#responseHandlers">responseHandler</a> argument. [[docs]](https://docs.yesgraph.com/docs/address-book)
```
YesGraphAPI.rankContacts(addressBook);
```
The addressBook object should contain a "source" object and a list of "entries" objects. You can input way more data than in this example, so definitely check out the [docs](https://docs.yesgraph.com/docs/address-book), but this is enough to get you started:
```
var addressBook = {
    "source": {
        "name": "Augusta Lovelace"
        "email": "ada@gmail.com",
        "type": "gmail"
    },
    "entries": [
        {
            "name": "Joe Schmoe",
            "emails": ["joe@yesgraph.com", "joseph@schmoseph.com"],
            "company": "YesGraph",
            "position": "Software Engineer"
        },
        {
            "emails": ["support@apple.com"],
            "phones": ["+1 800 MY APPLE"],
            "data": {"foo": "bar"}
        },
        {
            "name": "Dad",
            "emails": ["george.byron@hotmail.com"]
            "data": {"picture_url": "http://tinyurl.com/zctkrsf"}
        }
    ]
}
```
<b>Note:</b> Use this method when you first want to submit an address book for ranking, and as a convenience, the response data will contain the ranked results. However, if you'd like to retrieve those results again later on, using <a href="#getRankedContacts">`getRankedContacts`</a> is the fastest way. (<a href="#getRankedContacts">`getRankedContacts`</a> returns cached results, which is faster than ranking the results again each time.)


<a name="getRankedContacts"><hr></a>
####getRankedContacts
Retrieve a previously ranked address book using the `getRankedContacts` method. You can optionally pass a <a href="#responseHandlers">responseHandler</a> argument. [[docs]](https://docs.yesgraph.com/docs/address-book)
```
YesGraphAPI.getRankedContacts();
```
The response should look something like this:
```
{
  "meta": {
    "app_name": YOUR_APP_ID,
    "time": 0.00553584098815918,
    "total_count": 2,
    "user_id": "YG-123456789-a1b2-1234-5678-a1b2c3456789"
  },
  "data": [
    {
        "rank": 1,
        "score": 1.9576705489335122,
        "name": "Dad",
        "emails": ["george.byron@hotmail.com"],
        "data": {"picture_url": "http://tinyurl.com/zctkrsf"}
    },
    {
        "rank": 2,
        "score": 1.7161657326250732,
        "name": "Joe Schmoe",
        "emails": ["joe@yesgraph.com", "joseph@schmoseph.com"],
        "company": "YesGraph",
        "position": "Software Engineer"
    }
  ]
}
```

<a name="postSuggestedSeen"><hr></a>
####postSuggestedSeen
Once you've suggested some contacts for your user to invite, there are a few things you'll want to tell us:
- which contacts the user saw,
- which contacts they invited, and
- which invites were accepted.

By tracking this data, we can progressively improve the ranking model for your app over time, and you'll grow faster!

Use the `postSuggestedSeen` method to let us know which contacts you suggested to the user. Pass in an object representing the contacts you suggested to the user and, optionally, a <a href="#responseHandlers">responseHandler</a>. [[docs]](https://docs.yesgraph.com/docs/suggested-seen)
```
YesGraphAPI.postSuggestedSeen(seenContacts);
```
The seenContacts argument should be an object containing a list of "entries":
```
var seenContacts = {
    "entries": [
        {
            "name":"Joe Schmoe",
            "emails": ["joe@yesgraph.com", "joseph@schmoseph.com"],
            "seen_at": "2015-12-31T23:59:59+00:00"
        },
        {
            "name": "Dad",
            "emails": ["george.byron@hotmail.com"]
            "data": {"picture_url": "http://tinyurl.com/zctkrsf"}
        }
    ]
}
```

<a name="postInvitesSent"><hr></a>
####postInvitesSent
Use the `postInvitesSent` method to tell us who the user ended up inviting [[docs]](https://docs.yesgraph.com/docs/invites-sent). We'll track which contacts users invited to your app, and we'll suggest more contacts like them! Pass in an object representing the invites that were sent and, optionally, a <a href="#responseHandlers">responseHandler</a>.
```
YesGraphAPI.postInvitesSent(invitesSent);
```
The invitesSent object should look something like this:
```
var invitesSent = {
    "entries": [
        {
            "invitee_name":"Dad",
            "email": "george.byron@hotmail.com",
            "sent_at": "2016-01-01T01:01:01+00:00"
        },
        {
            "email": "ralph@lovelace.gov",
            "sent_at": "2016-01-01T01:01:02+00:00"
        }
    ]
}
```

<a name="postInvitesAccepted"><hr></a>
####postInvitesAccepted
Use the `postInvitesAccepted` method to tell us which invites got accepted [[docs]](https://docs.yesgraph.com/docs/invites-accepted). We'll track which contacts are most likely to accept an invite to your app, and we'll suggest more contacts like them! Pass in an object representing the accepted invites.
Optionally, you can also pass in a <a href="#responseHandlers">responseHandler</a>.
```
YesGraphAPI.postInvitesAccepted(invitesAccepted);
```
Structure your invitesAccepted object this way:
```
var invitesAccepted = {
    "entries": [{
        "new_user_id":"12345",
        "name": "George Byron",
        "email": "george.byron@hotmail.com",
        "accepted_at": "2016-01-02T12:00:00+00:00"
    }]
}
```

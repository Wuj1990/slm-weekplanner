export const getDb = () =>
  window.FirebaseDB?.db ||
  window.FirebaseDB?.firestore ||
  null

export const getTools = () => window.FirebaseDB || {}

// Tijdelijke compatibiliteit met oude code
export const getFirebaseTools = getTools

const formatDocId = (str = '') =>
  str.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')

/* =========================
   USERS
========================= */

export const registerUserInFirebase = async (newUser) => {
  const { doc, setDoc } = getTools()
  const db = getDb()

  if (!db || !doc || !setDoc) {
    throw new Error('Database is nog niet geïnitialiseerd.')
  }

  const cleanEmail = newUser.email.trim().toLowerCase()

  const formattedUser = {
    ...newUser,
    email: cleanEmail
  }

  await setDoc(
    doc(db, 'users', formatDocId(cleanEmail)),
    formattedUser
  )

  return formattedUser
}

export const fetchUserByEmail = async (email) => {
  const { doc, getDoc } = getTools()
  const db = getDb()

  if (!db || !doc || !getDoc || !email) {
    return null
  }

  try {
    const snapshot = await getDoc(
      doc(db, 'users', formatDocId(email))
    )

    return snapshot.exists()
      ? snapshot.data()
      : null
  } catch (error) {
    console.error(
      'Fout bij direct ophalen gebruiker:',
      error
    )
    return null
  }
}

export const updateUserInFirebase = async (user) => {
  const { doc, setDoc } = getTools()
  const db = getDb()

  if (!db || !doc || !setDoc || !user?.email) {
    return
  }

  await setDoc(
    doc(db, 'users', formatDocId(user.email)),
    user,
    { merge: true }
  )
}

export const deleteUserFromFirebase = async (email) => {
  const {
    doc,
    deleteDoc,
    getDocs,
    query,
    where,
    collection
  } = getTools()

  const db = getDb()

  if (!db || !doc || !deleteDoc || !email) {
    return
  }

  const cleanEmail =
    email.trim().toLowerCase()

  await deleteDoc(
    doc(db, 'users', formatDocId(cleanEmail))
  )

  if (
    getDocs &&
    query &&
    where &&
    collection
  ) {
    const q = query(
      collection(db, 'reservations'),
      where('userEmail', '==', cleanEmail)
    )

    const snapshot = await getDocs(q)

    await Promise.all(
      snapshot.docs.map((reservationDoc) =>
        deleteDoc(
          doc(
            db,
            'reservations',
            reservationDoc.id
          )
        )
      )
    )
  }
}

/* =========================
   RESERVATIONS
========================= */

export const toggleSlotInFirebase = async ({
  userEmail,
  userName,
  week,
  day,
  slotLabel,
  activityId,
  isExisting
}) => {
  const {
    doc,
    setDoc,
    deleteDoc
  } = getTools()

  const db = getDb()

  if (
    !db ||
    !doc ||
    !setDoc ||
    !deleteDoc
  ) {
    return
  }

  const documentId = formatDocId(
    `${userEmail}_${week}_${day}_${slotLabel}`
  )

  const docRef = doc(
    db,
    'reservations',
    documentId
  )

  if (isExisting) {
    await deleteDoc(docRef)
  } else {
    await setDoc(docRef, {
      userEmail,
      userName,
      day,
      slot: slotLabel,
      activityId,
      week
    })
  }
}

export const deleteReservationFromFirebase =
  async (id) => {
    const { doc, deleteDoc } = getTools()
    const db = getDb()

    if (!db || !doc || !deleteDoc || !id) {
      return
    }

    await deleteDoc(
      doc(db, 'reservations', id)
    )
  }

/* =========================
   ACTIVITIES
========================= */

export const addActivityToFirebase = async (
  actData
) => {
  const { doc, setDoc } = getTools()
  const db = getDb()

  if (!db || !doc || !setDoc) {
    return
  }

  const actId =
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `act_${Date.now()}`

  await setDoc(
    doc(db, 'activities', actId),
    {
      id: actId,
      name: actData.name || '',
      color: actData.color || '#2563eb',
      category:
        actData.category || 'Praktijk',
      maxSlots:
        Number(actData.maxSlots) || 1,
      maxHours:
        Number(actData.maxHours) || 2,
      prerequisiteId:
        actData.prerequisiteId || '',
      description:
        actData.description ||
        'Geen beschrijving'
    }
  )
}

export const updateActivityInFirebase =
  async (actData) => {
    const { doc, setDoc } = getTools()
    const db = getDb()

    if (!actData?.id) {
      throw new Error(
        'Geen geldig activiteit-ID'
      )
    }

    if (!db || !doc || !setDoc) {
      return
    }

    await setDoc(
      doc(db, 'activities', actData.id),
      actData,
      { merge: true }
    )
  }

export const deleteActivityFromFirebase =
  async (id) => {
    const { doc, deleteDoc } = getTools()
    const db = getDb()

    if (!db || !doc || !deleteDoc || !id) {
      return
    }

    await deleteDoc(
      doc(db, 'activities', id)
    )
  }

/* =========================
   MANDATORY BLOCKS
========================= */

export const saveMandatoryBlock = async ({
  week,
  day,
  slot,
  activityId,
  targetLevelGroup
}) => {
  const { doc, setDoc } = getTools()
  const db = getDb()

  if (!db || !doc || !setDoc) {
    return
  }

  const documentId = formatDocId(
    `${week}_${day}_${slot}`
  )

  await setDoc(
    doc(db, 'mandatory', documentId),
    {
      id: documentId,
      week: week || '',
      day,
      slot,
      activityId: activityId || '',
      targetLevelGroup:
        targetLevelGroup || 'ALL'
    },
    { merge: true }
  )
}

export const removeMandatoryBlock = async ({
  week,
  day,
  slot
}) => {
  const { doc, deleteDoc } = getTools()
  const db = getDb()

  if (!db || !doc || !deleteDoc) {
    return
  }

  await deleteDoc(
    doc(
      db,
      'mandatory',
      formatDocId(
        `${week}_${day}_${slot} `
      )
    )
  )
}
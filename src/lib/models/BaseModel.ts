/**
 * @file BaseModel.ts
 * @description Kelas abstrak dasar (Base Class) untuk seluruh Domain Models sistem penyewaan garasi.
 * Mengimplementasikan pilar Object-Oriented Programming (OOP) Inheritance dan kontrak toDTO().
 */

/**
 * Superclass abstrak untuk entitas domain.
 *
 * @abstract
 * @class BaseModel
 * @template TDTO - Tipe representasi Data Transfer Object yang dihasilkan oleh model.
 */
export abstract class BaseModel<TDTO> {
	/**
	 * Mengonversi instance domain model menjadi objek DTO (Data Transfer Object) polos
	 * yang aman ditransmisikan antar layer arsitektur.
	 *
	 * @abstract
	 * @returns {TDTO} Representasi data DTO.
	 */
	public abstract toDTO(): TDTO;
}

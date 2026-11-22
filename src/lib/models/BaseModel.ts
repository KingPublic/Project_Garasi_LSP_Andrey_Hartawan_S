/**
 * Kelas induk untuk semua model agar punya method toDTO() yang seragam.
 *
 * @author Andrey Hartawan Suwardi
 * @version 1.0
 */
export abstract class BaseModel<TDTO> {
	/**
	 * Mengonversi model ke bentuk DTO polos.
	 */
	public abstract toDTO(): TDTO;
}
